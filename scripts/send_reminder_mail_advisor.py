# -*- coding: utf-8 -*-
"""顾问提醒邮件脚本（cron：每日 21:00）。

扫描"明天开始"的活动，向对应项目顾问发送提醒邮件。
邮件统一从 careersme@cuhk.edu.cn 发出；发送失败仅记录日志。
"""
from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from sqlalchemy import func, select  # noqa: E402

from x_models.id_x_008.src.models.x_models import (  # noqa: E402
    IaoEnlistActivity,
    IaoEnlistApply,
    IaoEnlistProject,
    IaoOwnerInfo,
    get_session,
)
from x_models.id_x_008.src.views.x_views import MAIL_FROM, _send_mail  # noqa: E402
from x_models.id_x_008.utils.log_util import logger  # noqa: E402


async def run() -> None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    day_start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    maker = get_session()
    async with maker() as session:
        result = await session.execute(select(IaoEnlistActivity).where(
            IaoEnlistActivity.activity_start_time >= day_start,
            IaoEnlistActivity.activity_start_time < day_end,
        ))
        activities = result.scalars().all()
        for activity in activities:
            try:
                project = await session.scalar(select(IaoEnlistProject).where(
                    IaoEnlistProject.id == activity.project_id
                ))
                if not project:
                    continue
                owner = await session.scalar(select(IaoOwnerInfo).where(
                    IaoOwnerInfo.name == project.owner
                ))
                if not owner or not owner.email:
                    logger.warning(f"顾问信息缺失（project={project.id}），跳过提醒邮件")
                    continue
                count = await session.scalar(select(
                    func.count()
                ).select_from(IaoEnlistApply).where(IaoEnlistApply.activity_id == activity.id))
                subject = f"咨询预约日程提醒-[{activity.name}]"
                html = (
                    f"<p>Dear {owner.name},</p>"
                    f"<p>您明日的咨询活动「{activity.name}」"
                    f"（{_fmt(activity.activity_start_time)} - {_fmt(activity.activity_end_time)}）"
                    f"已有报名记录，请提前安排。</p>"
                )
                _send_mail(subject, MAIL_FROM, owner.email, "", html)
                logger.info(f"顾问提醒邮件已处理: to={owner.email} activity={activity.name} apply={count}")
            except Exception as e:
                logger.error(f"顾问提醒邮件处理失败（activity={activity.id}）: {e}")


def _fmt(dt: datetime | None) -> str:
    return dt.strftime("%Y-%m-%d %H:%M") if dt else ""


if __name__ == "__main__":
    asyncio.run(run())
