"""业务层：全部业务逻辑，view_* 命名；异常在视图内捕获并转换为 ResponseType。

业务规则：
- 订单号：R + 8 位随机数字；
- 同 ISO 自然周限约 1 次（违反返回 403）；
- 活动开始前 24 小时截止报名（403）；
- 活动结束前 4 小时禁止取消（记录不存在 404 / 违反规则 403）；
- 活动状态 Open -> Full -> Closed 依据名额与时间自动流转；
- 批量上传命中已有记录则更新、否则新增，返回成功/失败计数；
- 管理操作未登录返回 401；
- 邮件统一从 careersme@cuhk.edu.cn 发出，失败仅记录日志不影响主流程。
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import os
import secrets
import smtplib
import string
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from io import BytesIO
from typing import Any

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Border, PatternFill, Side
from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.types import Info

from ...utils.log_util import get_request_id, logger
from ..models.x_models import (
    AaEnlistActivity,
    AaEnlistApply,
    AaEnlistContent,
    AaEnlistProject,
    AaEnlistUser,
    AaHtmlTemplate,
    AaOwnerInfo,
    get_session,
)
from ..schemas.x_schemas import (
    ActivityDetailInput,
    ActivityIdInput,
    ActivityNameListInput,
    ApplyInput,
    CancelApplyInput,
    CreateActivityInput,
    CreateProjectInput,
    ExportActivityInput,
    FileResponseType,
    FuzzyNameInput,
    HealthType,
    LoginInput,
    OauthInput,
    PageInput,
    ProjectIdInput,
    QueryDataInput,
    ResponseType,
    SearchActivityInput,
    SearchProjectInput,
    SearchUserActivityInput,
    TitleListInput,
    UpdateActivityInput,
    UpdateProjectInput,
    UploadActivityInput,
    UserActivityListInput,
)

# ===== 常量 =====
def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, "") or default)
    except (TypeError, ValueError):
        return default


MAIL_SERVER = os.environ.get("AA_MAIL_SERVER", "mail.cuhk.edu.cn")
MAIL_PORT = _env_int("AA_MAIL_PORT", 587)
MAIL_USER = os.environ.get("AA_MAIL_USER", "careersme@cuhk.edu.cn")
MAIL_FROM = os.environ.get("AA_MAIL_FROM", MAIL_USER)
MAIL_PASSWORD = os.environ.get("AA_MAIL_PASSWORD", "")
MAX_UPLOAD_BYTES = _env_int("AA_MAX_UPLOAD_BYTES", 10 * 1024 * 1024)

APPLY_DEADLINE_HOURS = 24   # 开始前 24 小时截止报名
CANCEL_FORBID_HOURS = 4     # 结束前 4 小时禁取消

STATUS_OPEN = "Open"
STATUS_FULL = "Full"
STATUS_CLOSED = "Closed"


# ===== 通用工具 =====
def _rid() -> str:
    return get_request_id()


def _resp(code: int, message: str, data: Any = None) -> ResponseType:
    payload = json.dumps(data if data is not None else {}, ensure_ascii=False, default=str)
    return ResponseType(code=code, message=message, data=payload)


def _file_resp(code: int, message: str, file_name: str = "", file_base64: str = "") -> FileResponseType:
    return FileResponseType(code=code, message=message, file_name=file_name, file_base64=file_base64)


def _ms_to_dt(value: Any) -> datetime | None:
    """毫秒时间戳 -> datetime；非法输入返回 None。"""
    if value in (None, ""):
        return None
    try:
        return datetime.fromtimestamp(int(value) / 1000)
    except (TypeError, ValueError, OSError):
        return None


def _dt_str(dt: datetime | None) -> str:
    return dt.strftime("%Y-%m-%d %H:%M") if dt else ""


async def _first(session: AsyncSession, stmt: Any) -> Any:
    result = await session.execute(stmt)
    return result.scalars().first()


def _get_token(info: Info) -> str | None:
    """从 GraphQL 请求上下文中读取 Token 请求头。"""
    ctx = info.context
    request = ctx.get("request") if isinstance(ctx, dict) else getattr(ctx, "request", None)
    if request is None:
        return None
    return request.headers.get("Token")


async def _get_user_by_token(info: Info) -> AaEnlistUser | None:
    token = _get_token(info)
    if not token or token == "N/A":
        return None
    try:
        maker = get_session()
        async with maker() as session:
            return await _first(session, select(AaEnlistUser).where(AaEnlistUser.key == token))
    except Exception as e:
        logger.error(f"{_rid()}Token验证失败: {e}")
        return None


async def _verify_admin(info: Info) -> bool:
    """管理接口鉴权：Token 有效且角色为 admin。"""
    user = await _get_user_by_token(info)
    return bool(user and user.role == "admin")


async def _verify_user(info: Info, user_id: Any) -> bool:
    """学生接口鉴权：Token 必须属于该 user_id（admin 可代查）。"""
    user = await _get_user_by_token(info)
    if not user:
        return False
    return user.role == "admin" or user.id == int(user_id)


def _new_token() -> str:
    return secrets.token_hex(32)


def _hash_password(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _activity_status(apply_count: int, quota: int, activity: AaEnlistActivity) -> str:
    """活动状态机：Open -> Full -> Closed。

    Closed：报名截止已过，或活动已开始/结束；
    Full：报名数 >= 名额；
    Open：其余。
    """
    now = datetime.now()
    if activity.activity_end_time and now >= activity.activity_end_time:
        return STATUS_CLOSED
    if activity.activity_start_time and now >= activity.activity_start_time:
        return STATUS_CLOSED
    if activity.apply_end_time and now >= activity.apply_end_time:
        return STATUS_CLOSED
    if activity.apply_start_time and now < activity.apply_start_time:
        return STATUS_OPEN
    if quota > 0 and apply_count >= quota:
        return STATUS_FULL
    return STATUS_OPEN


def _send_mail(mail_subject: str, mail_from: str, mail_to: str, mail_cc: str, mail_html: str) -> bool:
    """发送邮件；失败仅记录日志，不抛出异常。"""
    try:
        msg = MIMEMultipart()
        msg["Subject"] = mail_subject
        msg["From"] = mail_from
        msg["To"] = mail_to
        if mail_cc:
            msg["Cc"] = mail_cc
        msg.attach(MIMEText(mail_html or mail_subject, "html", "utf-8"))
        with smtplib.SMTP(MAIL_SERVER, MAIL_PORT, timeout=30) as server:
            server.starttls()
            if MAIL_PASSWORD:
                server.login(MAIL_USER, MAIL_PASSWORD)
            server.sendmail(mail_from, [mail_to] + ([mail_cc] if mail_cc else []), msg.as_string())
        return True
    except Exception as e:
        logger.error(f"{_rid()}邮件发送失败（不影响主流程）: to={mail_to} subject={mail_subject} err={e}")
        return False


def _log_mail(message: str, mail_to: str, subject: str) -> None:
    logger.info(f"{_rid()}{message} to={mail_to} subject={subject}")


async def _apply_count(session: AsyncSession, activity_id: int) -> int:
    result = await session.execute(
        select(func.count()).select_from(AaEnlistApply).where(AaEnlistApply.activity_id == activity_id)
    )
    return int(result.scalar() or 0)


def _activity_dict(activity: AaEnlistActivity, project: AaEnlistProject | None,
                   apply_count: int, occupied_topics: list[str] | None = None) -> dict:
    quota = 0
    try:
        quota = int(project.quota) if project and project.quota not in ("N/A", "") else 0
    except ValueError:
        quota = 0
    return {
        "activity_id": activity.id,
        "activity_name": activity.name,
        "project_id": activity.project_id,
        "project_name": project.name if project else "",
        "owner": project.owner if project else "",
        "content": project.content if project else "",
        "quota": quota,
        "apply_count": apply_count,
        "state": _activity_status(apply_count, quota, activity),
        "activity_start_time": activity.activity_start_time.isoformat() if activity.activity_start_time else "",
        "activity_end_time": activity.activity_end_time.isoformat() if activity.activity_end_time else "",
        "apply_start_time": activity.apply_start_time.isoformat() if activity.apply_start_time else "",
        "apply_end_time": activity.apply_end_time.isoformat() if activity.apply_end_time else "",
        "occupied_topics": occupied_topics or [],
        "time": activity.time.isoformat() if activity.time else "",
        "update": activity.update.isoformat() if activity.update else "",
    }


def _apply_dict(obj: AaEnlistApply, activity: AaEnlistActivity | None = None) -> dict:
    return {
        "id": obj.id,
        "project_id": obj.project_id,
        "activity_id": obj.activity_id,
        "activity_name": activity.name if activity else "",
        "user_id": obj.user_id,
        "order": obj.order,
        "name": obj.name,
        "number": obj.number,
        "grade": obj.grade,
        "email": obj.email,
        "state": obj.state,
        "info_1": obj.info_1,
        "info_2": obj.info_2,
        "info_3": obj.info_3,
        "info_4": obj.info_4,
        "info_5": obj.info_5,
        "info_6": obj.info_6,
        "info_7": obj.info_7,
        "info_8": obj.info_8,
        "time": obj.time.strftime("%Y-%m-%d %H:%M") if obj.time else "",
        "activity_start_time": _dt_str(activity.activity_start_time) if activity else "",
        "activity_end_time": _dt_str(activity.activity_end_time) if activity else "",
    }


async def _project_map(session: AsyncSession) -> dict[int, AaEnlistProject]:
    result = await session.execute(select(AaEnlistProject))
    return {p.id: p for p in result.scalars().all() if p.id is not None}


# ===== 健康检查 =====
async def view_health(info: Info) -> HealthType:
    return HealthType(status="ok", service="id_x_008")


# ===== 认证 =====
async def view_login(info: Info, input: LoginInput) -> ResponseType:
    maker = get_session()
    async with maker() as session:
        try:
            user = await _first(session, select(AaEnlistUser).where(
                AaEnlistUser.username == input.username,
                AaEnlistUser.role == "admin",
            ))
            if not user or user.password != _hash_password(input.password):
                return _resp(403, "用户名或密码错误")
            token = _new_token()
            user.key = token
            user.time = datetime.now()
            await session.commit()
            return _resp(200, "success", {
                "user_id": user.id,
                "username": user.username,
                "role": user.role,
                "token": token,
            })
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_logout(info: Info) -> ResponseType:
    user = await _get_user_by_token(info)
    if not user:
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            db_user = await _first(session, select(AaEnlistUser).where(AaEnlistUser.id == user.id))
            if db_user:
                db_user.key = "N/A"
                await session.commit()
            return _resp(200, "success")
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_user_oauth(info: Info, input: OauthInput) -> ResponseType:
    """SSO 登录回调：解析 token 中的学号/姓名/邮箱，首次登录自动建档。

    oauth_token 约定为 JSON base64：{"number","name","email","grade"}；
    解析失败返回 400。生产环境应替换为 ADFS 真实校验。
    """
    try:
        padded = input.oauth_token + "=" * (-len(input.oauth_token) % 4)
        profile = json.loads(base64.b64decode(padded).decode("utf-8"))
    except (ValueError, binascii.Error) as e:
        logger.error(f"{_rid()}SSO token 解析失败: {e}")
        return _resp(400, "SSO Token 格式错误")

    number = str(profile.get("number", "")).strip()
    if not number:
        return _resp(400, "SSO Token 缺少学号字段")

    maker = get_session()
    async with maker() as session:
        try:
            user = await _first(session, select(AaEnlistUser).where(AaEnlistUser.number == number))
            if not user:
                user = AaEnlistUser(
                    username=number,
                    password="N/A",
                    role="user",
                    name=profile.get("name", "N/A"),
                    grade=profile.get("grade", "N/A"),
                    number=number,
                    email=profile.get("email", "N/A"),
                    time=datetime.now(),
                )
                session.add(user)
                await session.flush()
            token = _new_token()
            user.key = token
            await session.commit()
            return _resp(200, "success", {
                "user_id": user.id,
                "name": user.name,
                "number": user.number,
                "role": user.role,
                "token": token,
            })
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


# ===== 学生端 · 活动浏览 =====
async def view_get_user_activity_list(info: Info, input: UserActivityListInput) -> ResponseType:
    maker = get_session()
    async with maker() as session:
        try:
            stmt = select(AaEnlistActivity).order_by(AaEnlistActivity.activity_start_time)
            start = _ms_to_dt(input.start_date)
            end = _ms_to_dt(input.end_date)
            if start:
                stmt = stmt.where(AaEnlistActivity.activity_start_time >= start)
            if end:
                stmt = stmt.where(AaEnlistActivity.activity_start_time <= end)
            if input.fuzzy_name:
                stmt = stmt.where(AaEnlistActivity.name.like(f"%{input.fuzzy_name}%"))
            result = await session.execute(stmt)
            activities = result.scalars().all()
            projects = await _project_map(session)
            items = [
                _activity_dict(a, projects.get(a.project_id or -1), await _apply_count(session, a.id))
                for a in activities
            ]
            total = len(items)
            offset = max(input.offset, 1)
            limit = max(input.limit, 1)
            page = items[(offset - 1) * limit: offset * limit]
            return _resp(200, "success", {"total": total, "list": page})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_search_user_activity(info: Info, input: SearchUserActivityInput) -> ResponseType:
    """学生端活动筛选查询（时间区间 + 名称模糊 + 状态）。"""
    list_resp = await view_get_user_activity_list(info, UserActivityListInput(
        start_date=input.start_date,
        end_date=input.end_date,
        offset=1,
        limit=100000,
        fuzzy_name=input.fuzzy_name,
    ))
    if list_resp.code != 200:
        return list_resp
    data = json.loads(list_resp.data)
    items = data.get("list", [])
    if input.state:
        items = [i for i in items if i.get("state") == input.state]
    return _resp(200, "success", {"total": len(items), "list": items})


async def view_get_user_activity_detail(info: Info, input: ActivityDetailInput) -> ResponseType:
    """活动详情（含话题占用状态）。"""
    maker = get_session()
    async with maker() as session:
        try:
            activity = await _first(session, select(AaEnlistActivity).where(
                AaEnlistActivity.id == int(input.activity_id)
            ))
            if not activity:
                return _resp(404, "活动不存在")
            project = await _first(session, select(AaEnlistProject).where(
                AaEnlistProject.id == activity.project_id
            ))
            result = await session.execute(select(AaEnlistApply).where(
                AaEnlistApply.activity_id == activity.id
            ))
            applies = result.scalars().all()
            occupied = [a.info_1 for a in applies if a.info_1 and a.info_1 != "N/A"]
            return _resp(200, "success", _activity_dict(activity, project, len(applies), occupied))
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_fuzzy_activity_name(info: Info, input: FuzzyNameInput) -> ResponseType:
    maker = get_session()
    async with maker() as session:
        try:
            result = await session.execute(select(AaEnlistActivity.name).where(
                AaEnlistActivity.name.startswith(input.fuzzy_name)
            ).distinct())
            return _resp(200, "success", {"name_list": [r[0] for r in result.all()]})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


# ===== 学生端 · 报名 / 取消 =====
async def view_apply_activity(info: Info, input: ApplyInput) -> ResponseType:
    if not await _verify_user(info, input.user_id):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            user_id_str = str(input.user_id)
            activity = await _first(session, select(AaEnlistActivity).where(
                AaEnlistActivity.id == int(input.activity_id)
            ))
            if not activity:
                return _resp(404, "活动不存在")
            user = await _first(session, select(AaEnlistUser).where(AaEnlistUser.id == input.user_id))
            if not user:
                return _resp(404, "用户不存在")

            # 规则：开始前 24 小时截止报名
            now = datetime.now()
            if activity.activity_start_time and now >= activity.activity_start_time - timedelta(hours=APPLY_DEADLINE_HOURS):
                return _resp(403, "Registration closes 24 hours before the activity starts.", {
                    "activity_id": input.activity_id,
                    "activity_name": activity.name,
                })

            # 规则：同 ISO 自然周限约 1 次
            result = await session.execute(select(AaEnlistApply).where(AaEnlistApply.user_id == user_id_str))
            existing = result.scalars().all()
            if existing and activity.activity_start_time:
                target_iso = activity.activity_start_time.isocalendar()[:2]
                act_ids = {a.activity_id for a in existing if a.activity_id}
                if act_ids:
                    result = await session.execute(select(AaEnlistActivity).where(
                        AaEnlistActivity.id.in_(act_ids)
                    ))
                    for old_act in result.scalars().all():
                        if old_act.activity_start_time and old_act.activity_start_time.isocalendar()[:2] == target_iso:
                            return _resp(403, "You can only make one reservation in the same week.", {
                                "user_id": user_id_str,
                                "activity_id": input.activity_id,
                                "activity_name": activity.name,
                            })

            # 规则：名额已满（Full）
            project = await _first(session, select(AaEnlistProject).where(
                AaEnlistProject.id == activity.project_id
            ))
            quota = 0
            try:
                quota = int(project.quota) if project and project.quota not in ("N/A", "") else 0
            except ValueError:
                quota = 0
            count = await _apply_count(session, activity.id)
            if quota > 0 and count >= quota:
                return _resp(403, "This activity is full.", {"activity_id": input.activity_id})

            obj = AaEnlistApply(
                project_id=activity.project_id,
                activity_id=activity.id,
                user_id=user_id_str,
                order="R" + "".join(secrets.choice(string.digits) for _ in range(8)),
                name=user.name,
                number=user.number,
                grade=user.grade,
                email=user.email,
                state="Applied",
                info_1=input.info_1 or "N/A",
                info_2=input.info_2 or "N/A",
                info_3=input.info_3 or "N/A",
                time=datetime.now(),
            )
            session.add(obj)
            await session.commit()

            # 邮件通知（学生 + 顾问）；失败仅记录日志
            msg = {
                "_title": activity.name,
                "_date": activity.activity_start_time.strftime("%Y-%m-%d") if activity.activity_start_time else "",
                "_start_time": activity.activity_start_time.strftime("%H:%M") if activity.activity_start_time else "",
                "_end_time": activity.activity_end_time.strftime("%H:%M") if activity.activity_end_time else "",
            }
            template = await _first(session, select(AaHtmlTemplate).where(AaHtmlTemplate.type == "submit"))
            mail_html = template.html.format(**msg) if template else json.dumps(msg, ensure_ascii=False)
            _send_mail("Your sign-up: successful", MAIL_FROM, user.email, "", mail_html)
            _log_mail("Send Apply Email To Student Successful.", user.email, "Your sign-up: successful")

            owner = await _first(session, select(AaOwnerInfo).where(
                AaOwnerInfo.name == (project.owner if project else "")
            )) if project else None
            if owner and owner.email:
                ex_msg = {**msg, "_teacher_name": owner.name, "_student_name": user.name}
                template = await _first(session, select(AaHtmlTemplate).where(AaHtmlTemplate.type == "submit_ex"))
                ex_html = template.html.format(**ex_msg) if template else json.dumps(ex_msg, ensure_ascii=False)
                subject = f"咨询预约提醒-[{user.name}]"
                _send_mail(subject, MAIL_FROM, owner.email, "", ex_html)
                _log_mail("Send Apply Email To Advisor Successful.", owner.email, subject)
            else:
                logger.warning(f"{_rid()}顾问信息缺失（project={activity.project_id}），跳过顾问通知邮件")

            return _resp(200, "success", _apply_dict(obj, activity))
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_cancel_apply(info: Info, input: CancelApplyInput) -> ResponseType:
    if not await _verify_user(info, input.user_id):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            apply_obj = await _first(session, select(AaEnlistApply).where(
                AaEnlistApply.id == input.apply_id,
                AaEnlistApply.user_id == str(input.user_id),
            ))
            if not apply_obj:
                return _resp(404, "报名记录不存在")
            activity = await _first(session, select(AaEnlistActivity).where(
                AaEnlistActivity.id == apply_obj.activity_id
            ))
            # 规则：结束前 4 小时禁取消
            if activity and activity.activity_end_time and \
                    datetime.now() >= activity.activity_end_time - timedelta(hours=CANCEL_FORBID_HOURS):
                return _resp(403, "Cancellation is not allowed within 4 hours before the activity ends.", {
                    "apply_id": input.apply_id,
                    "activity_name": activity.name,
                })

            user = await _first(session, select(AaEnlistUser).where(AaEnlistUser.id == input.user_id))
            await session.execute(delete(AaEnlistApply).where(AaEnlistApply.id == input.apply_id))
            await session.commit()

            # 邮件通知（学生 + 顾问）；失败仅记录日志
            if user and activity:
                msg = {
                    "_title": activity.name,
                    "_date": activity.activity_start_time.strftime("%Y-%m-%d") if activity.activity_start_time else "",
                    "_start_time": activity.activity_start_time.strftime("%H:%M") if activity.activity_start_time else "",
                    "_end_time": activity.activity_end_time.strftime("%H:%M") if activity.activity_end_time else "",
                }
                template = await _first(session, select(AaHtmlTemplate).where(AaHtmlTemplate.type == "cancel"))
                mail_html = template.html.format(**msg) if template else json.dumps(msg, ensure_ascii=False)
                _send_mail("Your cancellation: successful", MAIL_FROM, user.email, "", mail_html)
                _log_mail("Send Cancel Email To Student Successful.", user.email, "Your cancellation: successful")

                project = await _first(session, select(AaEnlistProject).where(
                    AaEnlistProject.id == activity.project_id
                ))
                owner = await _first(session, select(AaOwnerInfo).where(
                    AaOwnerInfo.name == (project.owner if project else "")
                )) if project else None
                if owner and owner.email:
                    subject = f"咨询取消提醒-[{user.name}]"
                    _send_mail(subject, MAIL_FROM, owner.email, "", mail_html)
                    _log_mail("Send Cancel Email To Advisor Successful.", owner.email, subject)

            return _resp(200, "success", {"apply_id": input.apply_id})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


# ===== 管理后台 · 项目 =====
async def view_get_project_list(info: Info, input: PageInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            stmt = select(AaEnlistProject).order_by(desc(AaEnlistProject.time))
            start = _ms_to_dt(input.start_date)
            end = _ms_to_dt(input.end_date)
            if start:
                stmt = stmt.where(AaEnlistProject.time >= start)
            if end:
                stmt = stmt.where(AaEnlistProject.time <= end)
            result = await session.execute(stmt)
            projects = result.scalars().all()
            total = len(projects)
            offset = max(input.offset, 1)
            limit = max(input.limit, 1)
            page = projects[(offset - 1) * limit: offset * limit]
            items = [{
                "project_id": p.id,
                "project_name": p.name,
                "project_content": p.content,
                "quota": p.quota,
                "owner": p.owner,
                "time": p.time.isoformat() if p.time else "",
                "update": p.update.isoformat() if p.update else "",
            } for p in page]
            return _resp(200, "success", {"total": total, "list": items})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_create_project(info: Info, input: CreateProjectInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            existing = await _first(session, select(AaEnlistProject).where(
                AaEnlistProject.name == input.project_name
            ))
            if existing:
                return _resp(403, "项目名称已存在")
            content_obj = AaEnlistContent(content=input.project_content, time=datetime.now())
            session.add(content_obj)
            await session.flush()
            project = AaEnlistProject(
                name=input.project_name,
                quota=input.quota,
                content=input.project_content,
                content_ex_id=content_obj.id,
                owner=input.owner,
                time=datetime.now(),
                update=datetime.now(),
            )
            session.add(project)
            await session.commit()
            return _resp(200, "success", {"project_id": project.id})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_update_project(info: Info, input: UpdateProjectInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            project = await _first(session, select(AaEnlistProject).where(
                AaEnlistProject.id == input.project_id
            ))
            if not project:
                return _resp(404, "项目不存在")
            duplicate = await _first(session, select(AaEnlistProject).where(
                AaEnlistProject.name == input.project_name,
                AaEnlistProject.id != input.project_id,
            ))
            if duplicate:
                return _resp(403, "项目名称已存在")
            project.name = input.project_name
            project.content = input.project_content
            project.quota = input.quota
            if input.owner:
                project.owner = input.owner
            project.update = datetime.now()
            if project.content_ex_id:
                content_obj = await _first(session, select(AaEnlistContent).where(
                    AaEnlistContent.id == project.content_ex_id
                ))
                if content_obj:
                    content_obj.content = input.project_content
            await session.commit()
            return _resp(200, "success", {"project_id": project.id})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_delete_project(info: Info, input: ProjectIdInput) -> ResponseType:
    """删除项目：级联删除其活动与报名。"""
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            project = await _first(session, select(AaEnlistProject).where(
                AaEnlistProject.id == input.project_id
            ))
            if not project:
                return _resp(404, "项目不存在")
            await session.execute(delete(AaEnlistApply).where(AaEnlistApply.project_id == input.project_id))
            await session.execute(delete(AaEnlistActivity).where(AaEnlistActivity.project_id == input.project_id))
            # 先解除项目对 content 的外键引用，再删 content，避免 FK 冲突
            await session.execute(delete(AaEnlistProject).where(AaEnlistProject.id == input.project_id))
            if project.content_ex_id:
                await session.execute(delete(AaEnlistContent).where(AaEnlistContent.id == project.content_ex_id))
            await session.commit()
            return _resp(200, "success", {"project_id": input.project_id})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_search_project(info: Info, input: SearchProjectInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            result = await session.execute(select(AaEnlistProject).where(
                AaEnlistProject.name.like(f"%{input.project_name}%")
            ))
            items = [{
                "project_id": p.id,
                "project_name": p.name,
                "project_content": p.content,
                "quota": p.quota,
                "owner": p.owner,
                "time": p.time.isoformat() if p.time else "",
                "update": p.update.isoformat() if p.update else "",
            } for p in result.scalars().all()]
            return _resp(200, "success", {"total": len(items), "list": items})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_search_project_owner(info: Info) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            result = await session.execute(select(AaOwnerInfo))
            items = [{"name": o.name, "email": o.email} for o in result.scalars().all()]
            return _resp(200, "success", {"owner_list": items})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_get_project_name_list(info: Info) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            result = await session.execute(select(AaEnlistProject.id, AaEnlistProject.name))
            items = [{"project_id": r[0], "project_name": r[1]} for r in result.all()]
            return _resp(200, "success", {"name_list": items})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


# ===== 管理后台 · 活动 =====
async def view_get_activity_list(info: Info, input: PageInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            stmt = select(AaEnlistActivity).order_by(desc(AaEnlistActivity.activity_start_time))
            start = _ms_to_dt(input.start_date)
            end = _ms_to_dt(input.end_date)
            if start:
                stmt = stmt.where(AaEnlistActivity.activity_start_time >= start)
            if end:
                stmt = stmt.where(AaEnlistActivity.activity_start_time <= end)
            result = await session.execute(stmt)
            activities = result.scalars().all()
            projects = await _project_map(session)
            items = [
                _activity_dict(a, projects.get(a.project_id or -1), await _apply_count(session, a.id))
                for a in activities
            ]
            total = len(items)
            offset = max(input.offset, 1)
            limit = max(input.limit, 1)
            page = items[(offset - 1) * limit: offset * limit]
            return _resp(200, "success", {"total": total, "list": page})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_get_activity_detail(info: Info, input: ActivityIdInput) -> ResponseType:
    """单活动报名明细。"""
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            activity = await _first(session, select(AaEnlistActivity).where(
                AaEnlistActivity.id == input.activity_id
            ))
            if not activity:
                return _resp(404, "活动不存在")
            result = await session.execute(select(AaEnlistApply).where(
                AaEnlistApply.activity_id == input.activity_id
            ).order_by(desc(AaEnlistApply.time)))
            items = [_apply_dict(a, activity) for a in result.scalars().all()]
            return _resp(200, "success", {
                "activity_id": activity.id,
                "activity_name": activity.name,
                "total": len(items),
                "list": items,
            })
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_create_activity(info: Info, input: CreateActivityInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            project = await _first(session, select(AaEnlistProject).where(
                AaEnlistProject.id == input.project_id
            ))
            if not project:
                return _resp(404, "项目不存在")
            activity = AaEnlistActivity(
                name=input.activity_name or project.name,
                project_id=input.project_id,
                activity_start_time=_ms_to_dt(input.activity_start_time),
                activity_end_time=_ms_to_dt(input.activity_end_time),
                apply_start_time=_ms_to_dt(input.apply_start_time),
                apply_end_time=_ms_to_dt(input.apply_end_time),
                time=datetime.now(),
                update=datetime.now(),
            )
            session.add(activity)
            await session.commit()
            return _resp(200, "success", {"activity_id": activity.id})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_update_activity(info: Info, input: UpdateActivityInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            activity = await _first(session, select(AaEnlistActivity).where(
                AaEnlistActivity.id == input.activity_id
            ))
            if not activity:
                return _resp(404, "活动不存在")
            if input.activity_name:
                activity.name = input.activity_name
            activity.project_id = input.project_id
            if input.activity_start_time:
                activity.activity_start_time = _ms_to_dt(input.activity_start_time)
            if input.activity_end_time:
                activity.activity_end_time = _ms_to_dt(input.activity_end_time)
            if input.apply_start_time:
                activity.apply_start_time = _ms_to_dt(input.apply_start_time)
            if input.apply_end_time:
                activity.apply_end_time = _ms_to_dt(input.apply_end_time)
            activity.update = datetime.now()
            await session.commit()
            return _resp(200, "success", {"activity_id": activity.id})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_delete_activity(info: Info, input: ActivityIdInput) -> ResponseType:
    """删除活动：级联删除报名。"""
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            activity = await _first(session, select(AaEnlistActivity).where(
                AaEnlistActivity.id == input.activity_id
            ))
            if not activity:
                return _resp(404, "活动不存在")
            await session.execute(delete(AaEnlistApply).where(AaEnlistApply.activity_id == input.activity_id))
            await session.execute(delete(AaEnlistActivity).where(AaEnlistActivity.id == input.activity_id))
            await session.commit()
            return _resp(200, "success", {"activity_id": input.activity_id})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_search_activity(info: Info, input: SearchActivityInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    if not input.fuzzy_name:
        return await view_get_activity_list(info, PageInput(
            start_date=input.start_date,
            end_date=input.end_date,
            offset=input.offset,
            limit=input.limit,
        ))
    return await _search_activity_by_name(info, input)


async def _search_activity_by_name(info: Info, input: SearchActivityInput) -> ResponseType:
    maker = get_session()
    async with maker() as session:
        try:
            stmt = select(AaEnlistActivity).where(
                AaEnlistActivity.name.like(f"%{input.fuzzy_name}%")
            ).order_by(desc(AaEnlistActivity.activity_start_time))
            start = _ms_to_dt(input.start_date)
            end = _ms_to_dt(input.end_date)
            if start:
                stmt = stmt.where(AaEnlistActivity.activity_start_time >= start)
            if end:
                stmt = stmt.where(AaEnlistActivity.activity_start_time <= end)
            result = await session.execute(stmt)
            activities = result.scalars().all()
            projects = await _project_map(session)
            items = [
                _activity_dict(a, projects.get(a.project_id or -1), await _apply_count(session, a.id))
                for a in activities
            ]
            total = len(items)
            offset = max(input.offset, 1)
            limit = max(input.limit, 1)
            page = items[(offset - 1) * limit: offset * limit]
            return _resp(200, "success", {"total": total, "list": page})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_get_activity_name_list(info: Info, input: ActivityNameListInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            stmt = select(AaEnlistActivity.name).distinct()
            start = _ms_to_dt(input.start_date)
            end = _ms_to_dt(input.end_date)
            if start:
                stmt = stmt.where(AaEnlistActivity.activity_start_time >= start)
            if end:
                stmt = stmt.where(AaEnlistActivity.activity_start_time <= end)
            if input.fuzzy_name:
                stmt = stmt.where(AaEnlistActivity.name.like(f"%{input.fuzzy_name}%"))
            result = await session.execute(stmt)
            names = [r[0] for r in result.all()]
            total = len(names)
            offset = max(input.offset, 1)
            limit = max(input.limit, 1)
            return _resp(200, "success", {
                "total": total,
                "name_list": names[(offset - 1) * limit: offset * limit],
            })
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_fuzzy_export_activity_name(info: Info, input: FuzzyNameInput) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            result = await session.execute(select(AaEnlistActivity.name).where(
                AaEnlistActivity.name.startswith(input.fuzzy_name)
            ).distinct())
            return _resp(200, "success", {"name_list": [r[0] for r in result.all()]})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


# ===== 管理后台 · Excel 批量排期 / 模板 / 导出 =====
UPLOAD_COLUMNS = ["project_id", "activity_name", "activity_start_time", "activity_end_time",
                  "apply_start_time", "apply_end_time"]


async def view_upload_activity(info: Info, input: UploadActivityInput) -> ResponseType:
    """Excel 批量排期上传：命中已有记录（同 project_id + activity_start_time）则更新，否则新增。"""
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    if not input.file_name.lower().endswith(".xlsx"):
        return _resp(400, "文件格式错误，仅支持 .xlsx")
    try:
        raw = base64.b64decode(input.file_base64)
    except (ValueError, binascii.Error):
        return _resp(400, "文件内容编码错误")
    if len(raw) > MAX_UPLOAD_BYTES:
        return _resp(400, "文件大小超出限制")

    try:
        df = pd.read_excel(BytesIO(raw))
    except Exception as e:
        logger.error(f"{_rid()}Excel 解析失败: {e}")
        return _resp(400, "Excel 解析失败，请使用模板填写")

    missing = [c for c in UPLOAD_COLUMNS if c not in df.columns]
    if missing:
        return _resp(400, f"Excel 缺少必要列: {','.join(missing)}")

    maker = get_session()
    success_count = 0
    fail_count = 0
    async with maker() as session:
        try:
            for _, row in df.iterrows():
                try:
                    project_id = int(row["project_id"])
                    start_time = pd.to_datetime(row["activity_start_time"]).to_pydatetime()
                    end_time = pd.to_datetime(row["activity_end_time"]).to_pydatetime()
                    apply_start = pd.to_datetime(row["apply_start_time"]).to_pydatetime()
                    apply_end = pd.to_datetime(row["apply_end_time"]).to_pydatetime()
                    name = str(row["activity_name"]) if pd.notna(row["activity_name"]) else "N/A"

                    project = await _first(session, select(AaEnlistProject).where(
                        AaEnlistProject.id == project_id
                    ))
                    if not project:
                        fail_count += 1
                        continue

                    existing = await _first(session, select(AaEnlistActivity).where(
                        AaEnlistActivity.project_id == project_id,
                        AaEnlistActivity.activity_start_time == start_time,
                    ))
                    if existing:
                        existing.name = name
                        existing.activity_end_time = end_time
                        existing.apply_start_time = apply_start
                        existing.apply_end_time = apply_end
                        existing.update = datetime.now()
                    else:
                        session.add(AaEnlistActivity(
                            name=name,
                            project_id=project_id,
                            activity_start_time=start_time,
                            activity_end_time=end_time,
                            apply_start_time=apply_start,
                            apply_end_time=apply_end,
                            time=datetime.now(),
                            update=datetime.now(),
                        ))
                    success_count += 1
                except Exception as row_err:
                    logger.error(f"{_rid()}排期行处理失败: {row_err}")
                    fail_count += 1
            await session.commit()
            return _resp(200, "success", {"success_count": success_count, "fail_count": fail_count})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


def _build_template_xlsx() -> bytes:
    """生成 14 天批量排期模板。"""
    wb = Workbook()
    ws = wb.active
    ws.title = "排期模板"
    ws.append(UPLOAD_COLUMNS)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    for day in range(14):
        base = today + timedelta(days=day, hours=9)
        ws.append([
            "<项目ID>",
            "<活动名称>",
            base.strftime("%Y-%m-%d %H:%M"),
            (base + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"),
            (base - timedelta(days=3)).strftime("%Y-%m-%d %H:%M"),
            (base - timedelta(hours=24)).strftime("%Y-%m-%d %H:%M"),
        ])
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


async def view_download_activity_template(info: Info) -> FileResponseType:
    if not await _verify_admin(info):
        return _file_resp(401, "Token Error")
    try:
        content = _build_template_xlsx()
        return _file_resp(200, "success", "activity_template.xlsx", base64.b64encode(content).decode())
    except Exception as e:
        logger.error(f"{_rid()}{e}")
        return _file_resp(500, "服务器错误")


def _build_export_xlsx(rows: list[dict]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "报名数据"
    headers = ["订单号", "活动名称", "姓名", "学号", "年级", "邮箱", "咨询话题",
               "活动开始时间", "活动结束时间", "报名时间", "状态"]
    header_fill = PatternFill("solid", fgColor="DDDDDD")
    thin = Border(*[Side(style="thin")] * 4)
    ws.append(headers)
    for cell in ws[1]:
        cell.fill = header_fill
        cell.border = thin
    for r in rows:
        ws.append([
            r.get("order", ""), r.get("activity_name", ""), r.get("name", ""),
            r.get("number", ""), r.get("grade", ""), r.get("email", ""),
            r.get("info_1", ""), r.get("activity_start_time", ""),
            r.get("activity_end_time", ""), r.get("time", ""), r.get("state", ""),
        ])
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


async def _query_applies(session: AsyncSession, titles: list[str],
                         start: datetime | None, end: datetime | None) -> list[dict]:
    stmt = select(AaEnlistApply, AaEnlistActivity).join(
        AaEnlistActivity, AaEnlistApply.activity_id == AaEnlistActivity.id
    ).order_by(desc(AaEnlistApply.time))
    if titles:
        stmt = stmt.where(AaEnlistActivity.name.in_(titles))
    if start:
        stmt = stmt.where(AaEnlistActivity.activity_start_time >= start)
    if end:
        stmt = stmt.where(AaEnlistActivity.activity_start_time <= end)
    result = await session.execute(stmt)
    return [_apply_dict(a, act) for a, act in result.all()]


async def view_export_activity(info: Info, input: ExportActivityInput) -> FileResponseType:
    """按时间区间 + 活动名多选导出 Excel。"""
    if not await _verify_admin(info):
        return _file_resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            rows = await _query_applies(session, input.activity_list,
                                        _ms_to_dt(input.start_time), _ms_to_dt(input.end_time))
            content = _build_export_xlsx(rows)
            return _file_resp(200, "success", "activity_export.xlsx", base64.b64encode(content).decode())
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _file_resp(500, "服务器错误")


# ===== 管理后台 · 跨活动数据查询 =====
async def view_search_query_title(info: Info) -> ResponseType:
    if not await _verify_admin(info):
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            result = await session.execute(select(AaEnlistActivity.name).distinct())
            return _resp(200, "success", {"title_list": [r[0] for r in result.all()]})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_search_query_data(info: Info, input: QueryDataInput) -> ResponseType:
    user = await _get_user_by_token(info)
    if not user:
        return _resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            rows = await _query_applies(session, input.title,
                                        _ms_to_dt(input.start_time), _ms_to_dt(input.end_time))
            # 非管理员（学生）仅可查看本人报名记录（我的记录页）
            if user.role != "admin":
                rows = [r for r in rows if r.get("user_id") == str(user.id)]
            total = len(rows)
            offset = max(input.offset, 1)
            limit = max(input.limit, 1)
            return _resp(200, "success", {"total": total, "list": rows[(offset - 1) * limit: offset * limit]})
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _resp(500, "服务器错误")


async def view_download_query_data(info: Info, input: TitleListInput) -> FileResponseType:
    if not await _verify_admin(info):
        return _file_resp(401, "Token Error")
    maker = get_session()
    async with maker() as session:
        try:
            rows = await _query_applies(session, input.title, None, None)
            content = _build_export_xlsx(rows)
            return _file_resp(200, "success", "query_data.xlsx", base64.b64encode(content).decode())
        except Exception as e:
            logger.error(f"{_rid()}{e}")
            await session.rollback()
            return _file_resp(500, "服务器错误")
