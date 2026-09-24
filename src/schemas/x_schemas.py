"""契约层：Strawberry GraphQL Input/Type 纯类型定义，不含任何业务逻辑。"""
from __future__ import annotations

from typing import List, Optional

import strawberry


# ===== 通用 =====
@strawberry.type
class HealthType:
    status: str = strawberry.field(description="服务状态")
    service: str = strawberry.field(description="服务名")


@strawberry.type
class ResponseType:
    """统一业务响应：code/message/data，data 为 JSON 字符串（客户端需二次解析）。"""
    code: int = strawberry.field(description="状态码")
    message: str = strawberry.field(description="消息")
    data: str = strawberry.field(default="{}", description="业务数据（JSON 字符串）")


@strawberry.type
class FileResponseType:
    """文件下载响应：以 base64 承载文件内容。"""
    code: int = strawberry.field(description="状态码")
    message: str = strawberry.field(description="消息")
    file_name: str = strawberry.field(default="", description="文件名")
    file_base64: str = strawberry.field(default="", description="文件内容（base64）")


# ===== 认证 =====
@strawberry.input
class LoginInput:
    username: str = strawberry.field(description="用户名")
    password: str = strawberry.field(default="", description="密码明文（兼容旧客户端）")
    encrypted_password: str = strawberry.field(default="", description="RSA-OAEP 加密密码（Base64，优先使用）")


@strawberry.input
class OauthInput:
    """学生 SSO 登录入参：ADFS 授权码授予流。

    - 优先使用 code（授权码，服务端用 client_secret 换 id_token，最安全）；
    - state 用于 CSRF 校验，由前端生成并在回调时原样回传；
    - oauth_token 仅为旧隐式流兼容保留，新流程不应使用。
    """
    code: str = strawberry.field(default="", description="ADFS 授权码（response_type=code 回调获得）")
    state: str = strawberry.field(default="", description="CSRF 防护随机串（与授权请求一致）")
    oauth_token: str = strawberry.field(default="", description="[已废弃] 旧隐式流 access_token")


# ===== 学生端 =====
@strawberry.input
class UserActivityListInput:
    start_date: Optional[str] = strawberry.field(default=None, description="开始时间（毫秒时间戳）")
    end_date: Optional[str] = strawberry.field(default=None, description="结束时间（毫秒时间戳）")
    offset: int = strawberry.field(default=1, description="页码")
    limit: int = strawberry.field(default=10, description="每页数量")
    fuzzy_name: str = strawberry.field(default="", description="活动名模糊匹配")


@strawberry.input
class SearchUserActivityInput:
    start_date: Optional[str] = strawberry.field(default=None, description="开始时间（毫秒时间戳）")
    end_date: Optional[str] = strawberry.field(default=None, description="结束时间（毫秒时间戳）")
    fuzzy_name: str = strawberry.field(default="", description="活动名模糊匹配")
    state: str = strawberry.field(default="", description="活动状态 Open/Full/Closed")


@strawberry.input
class ApplyInput:
    user_id: int = strawberry.field(description="用户ID")
    activity_id: str = strawberry.field(description="活动ID")
    info_1: str = strawberry.field(default="", description="咨询话题")
    info_2: str = strawberry.field(default="", description="扩展信息2")
    info_3: str = strawberry.field(default="", description="扩展信息3")


@strawberry.input
class ActivityDetailInput:
    activity_id: str = strawberry.field(description="活动ID")


@strawberry.input
class CancelApplyInput:
    user_id: int = strawberry.field(description="用户ID")
    apply_id: int = strawberry.field(description="报名ID")


@strawberry.input
class FuzzyNameInput:
    fuzzy_name: str = strawberry.field(default="", description="名称前缀模糊匹配")


# ===== 管理后台 · 项目 =====
@strawberry.input
class PageInput:
    start_date: Optional[str] = strawberry.field(default=None, description="开始时间（毫秒时间戳）")
    end_date: Optional[str] = strawberry.field(default=None, description="结束时间（毫秒时间戳）")
    offset: int = strawberry.field(default=1, description="页码")
    limit: int = strawberry.field(default=10, description="每页数量")
    sort_order: str = strawberry.field(default="asc", description="ID 排序：asc 升序 / desc 降序")


@strawberry.input
class CreateProjectInput:
    project_name: str = strawberry.field(default="N/A", description="项目名称（唯一）")
    project_content: str = strawberry.field(default="N/A", description="项目内容（富文本）")
    quota: str = strawberry.field(default="N/A", description="名额")
    owner: str = strawberry.field(default="N/A", description="所属顾问")


@strawberry.input
class UpdateProjectInput:
    project_id: int = strawberry.field(description="项目ID")
    project_name: str = strawberry.field(description="项目名称")
    project_content: str = strawberry.field(description="项目内容")
    quota: str = strawberry.field(description="名额")
    owner: str = strawberry.field(default="", description="所属顾问")


@strawberry.input
class ProjectIdInput:
    project_id: int = strawberry.field(description="项目ID")


@strawberry.input
class SearchProjectInput:
    project_name: str = strawberry.field(default="", description="项目名称模糊匹配")


# ===== 管理后台 · 活动 =====
@strawberry.input
class CreateActivityInput:
    project_id: int = strawberry.field(description="项目ID")
    activity_name: Optional[str] = strawberry.field(default=None, description="活动名称")
    activity_start_time: Optional[str] = strawberry.field(default=None, description="活动开始（毫秒时间戳）")
    activity_end_time: Optional[str] = strawberry.field(default=None, description="活动结束（毫秒时间戳）")
    apply_start_time: Optional[str] = strawberry.field(default=None, description="报名开始（毫秒时间戳）")
    apply_end_time: Optional[str] = strawberry.field(default=None, description="报名结束（毫秒时间戳）")


@strawberry.input
class UpdateActivityInput:
    activity_id: int = strawberry.field(description="活动ID")
    project_id: int = strawberry.field(description="项目ID")
    activity_name: Optional[str] = strawberry.field(default=None, description="活动名称")
    activity_start_time: Optional[str] = strawberry.field(default=None, description="活动开始（毫秒时间戳）")
    activity_end_time: Optional[str] = strawberry.field(default=None, description="活动结束（毫秒时间戳）")
    apply_start_time: Optional[str] = strawberry.field(default=None, description="报名开始（毫秒时间戳）")
    apply_end_time: Optional[str] = strawberry.field(default=None, description="报名结束（毫秒时间戳）")


@strawberry.input
class ActivityIdInput:
    activity_id: int = strawberry.field(description="活动ID")


@strawberry.input
class SearchActivityInput:
    fuzzy_name: str = strawberry.field(default="", description="活动名模糊匹配")
    start_date: Optional[str] = strawberry.field(default=None, description="开始时间（毫秒时间戳）")
    end_date: Optional[str] = strawberry.field(default=None, description="结束时间（毫秒时间戳）")
    offset: int = strawberry.field(default=1, description="页码")
    limit: int = strawberry.field(default=10, description="每页数量")


@strawberry.input
class ActivityNameListInput:
    start_date: Optional[str] = strawberry.field(default=None, description="开始时间（毫秒时间戳）")
    end_date: Optional[str] = strawberry.field(default=None, description="结束时间（毫秒时间戳）")
    offset: int = strawberry.field(default=1, description="页码")
    limit: int = strawberry.field(default=10, description="每页数量")
    fuzzy_name: str = strawberry.field(default="", description="活动名模糊匹配")


@strawberry.input
class UploadActivityInput:
    file_name: str = strawberry.field(description="文件名（.xlsx）")
    file_base64: str = strawberry.field(description="文件内容（base64）")


@strawberry.input
class ExportActivityInput:
    activity_list: List[str] = strawberry.field(description="活动名称列表")
    start_time: Optional[str] = strawberry.field(default=None, description="开始时间（毫秒时间戳）")
    end_time: Optional[str] = strawberry.field(default=None, description="结束时间（毫秒时间戳）")


# ===== 管理后台 · 跨活动数据查询 =====
@strawberry.input
class QueryDataInput:
    title: List[str] = strawberry.field(default_factory=list, description="活动名称列表")
    start_time: Optional[int] = strawberry.field(default=None, description="开始时间（毫秒时间戳）")
    end_time: Optional[int] = strawberry.field(default=None, description="结束时间（毫秒时间戳）")
    offset: int = strawberry.field(default=1, description="页码")
    limit: int = strawberry.field(default=10, description="每页数量")


@strawberry.input
class TitleListInput:
    title: List[str] = strawberry.field(description="活动名称列表")
