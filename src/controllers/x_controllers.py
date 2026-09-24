"""路由层：thin resolvers，只做参数透传，委托到 views。

统一端点：POST /b/id_x_008/graphql；响应统一 ResponseType{code,message,data}。
"""
from __future__ import annotations

import strawberry
from litestar import Router
from strawberry.extensions import QueryDepthLimiter
from strawberry.schema.config import StrawberryConfig
from strawberry.litestar import make_graphql_controller
from strawberry.types import Info

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
from ..views import x_views


@strawberry.type
class Query:
    @strawberry.field(description="健康检查")
    async def health(self, info: Info) -> HealthType:
        return await x_views.view_health(info)

    @strawberry.field(description="获取 RSA 公钥（用于加密登录密码）")
    async def public_key(self, info: Info) -> ResponseType:
        return await x_views.view_public_key(info)

    # ----- 学生端 -----
    @strawberry.field(description="学生端活动分页列表")
    async def get_user_activity_list(self, info: Info, input: UserActivityListInput) -> ResponseType:
        return await x_views.view_get_user_activity_list(info, input)

    @strawberry.field(description="活动筛选查询")
    async def search_user_activity(self, info: Info, input: SearchUserActivityInput) -> ResponseType:
        return await x_views.view_search_user_activity(info, input)

    @strawberry.field(description="活动详情（含话题占用状态）")
    async def get_user_activity_detail(self, info: Info, input: ActivityDetailInput) -> ResponseType:
        return await x_views.view_get_user_activity_detail(info, input)

    @strawberry.field(description="活动名模糊搜索")
    async def fuzzy_activity_name(self, info: Info, input: FuzzyNameInput) -> ResponseType:
        return await x_views.view_fuzzy_activity_name(info, input)

    # ----- 管理后台 · 项目 -----
    @strawberry.field(description="项目分页列表")
    async def get_project_list(self, info: Info, input: PageInput) -> ResponseType:
        return await x_views.view_get_project_list(info, input)

    @strawberry.field(description="项目查询")
    async def search_project(self, info: Info, input: SearchProjectInput) -> ResponseType:
        return await x_views.view_search_project(info, input)

    @strawberry.field(description="顾问下拉查询")
    async def search_project_owner(self, info: Info) -> ResponseType:
        return await x_views.view_search_project_owner(info)

    @strawberry.field(description="项目名清单")
    async def get_project_name_list(self, info: Info) -> ResponseType:
        return await x_views.view_get_project_name_list(info)

    # ----- 管理后台 · 活动 -----
    @strawberry.field(description="活动分页列表")
    async def get_activity_list(self, info: Info, input: PageInput) -> ResponseType:
        return await x_views.view_get_activity_list(info, input)

    @strawberry.field(description="单活动报名明细")
    async def get_activity_detail(self, info: Info, input: ActivityIdInput) -> ResponseType:
        return await x_views.view_get_activity_detail(info, input)

    @strawberry.field(description="活动查询")
    async def search_activity(self, info: Info, input: SearchActivityInput) -> ResponseType:
        return await x_views.view_search_activity(info, input)

    @strawberry.field(description="活动名清单")
    async def get_activity_name_list(self, info: Info, input: ActivityNameListInput) -> ResponseType:
        return await x_views.view_get_activity_name_list(info, input)

    @strawberry.field(description="导出活动名模糊搜索")
    async def fuzzy_export_activity_name(self, info: Info, input: FuzzyNameInput) -> ResponseType:
        return await x_views.view_fuzzy_export_activity_name(info, input)

    @strawberry.field(description="排期模板下载（Excel，base64）")
    async def download_activity_template(self, info: Info) -> FileResponseType:
        return await x_views.view_download_activity_template(info)

    @strawberry.field(description="报名数据 Excel 导出")
    async def export_activity(self, info: Info, input: ExportActivityInput) -> FileResponseType:
        return await x_views.view_export_activity(info, input)

    # ----- 管理后台 · 跨活动数据查询 -----
    @strawberry.field(description="跨活动标题查询")
    async def search_query_title(self, info: Info) -> ResponseType:
        return await x_views.view_search_query_title(info)

    @strawberry.field(description="跨活动报名数据查询")
    async def search_query_data(self, info: Info, input: QueryDataInput) -> ResponseType:
        return await x_views.view_search_query_data(info, input)

    @strawberry.field(description="跨活动报名数据下载（Excel，base64）")
    async def download_query_data(self, info: Info, input: TitleListInput) -> FileResponseType:
        return await x_views.view_download_query_data(info, input)


@strawberry.type
class Mutation:
    # ----- 认证 -----
    @strawberry.mutation(description="管理员账号密码登录")
    async def login(self, info: Info, input: LoginInput) -> ResponseType:
        return await x_views.view_login(info, input)

    @strawberry.mutation(description="登出")
    async def logout(self, info: Info) -> ResponseType:
        return await x_views.view_logout(info)

    @strawberry.mutation(description="SSO 登录回调建档")
    async def user_oauth(self, info: Info, input: OauthInput) -> ResponseType:
        return await x_views.view_user_oauth(info, input)

    # ----- 学生端 · 报名 -----
    @strawberry.mutation(description="提交报名（同周唯一校验，403 重复）")
    async def apply_activity(self, info: Info, input: ApplyInput) -> ResponseType:
        return await x_views.view_apply_activity(info, input)

    @strawberry.mutation(description="取消报名（结束前 4 小时禁取消，404）")
    async def cancel_apply(self, info: Info, input: CancelApplyInput) -> ResponseType:
        return await x_views.view_cancel_apply(info, input)

    # ----- 管理后台 · 项目 -----
    @strawberry.mutation(description="新增项目（name 唯一）")
    async def create_project(self, info: Info, input: CreateProjectInput) -> ResponseType:
        return await x_views.view_create_project(info, input)

    @strawberry.mutation(description="编辑项目")
    async def update_project(self, info: Info, input: UpdateProjectInput) -> ResponseType:
        return await x_views.view_update_project(info, input)

    @strawberry.mutation(description="删除项目（级联删除活动与报名）")
    async def delete_project(self, info: Info, input: ProjectIdInput) -> ResponseType:
        return await x_views.view_delete_project(info, input)

    # ----- 管理后台 · 活动 -----
    @strawberry.mutation(description="新增活动")
    async def create_activity(self, info: Info, input: CreateActivityInput) -> ResponseType:
        return await x_views.view_create_activity(info, input)

    @strawberry.mutation(description="编辑活动")
    async def update_activity(self, info: Info, input: UpdateActivityInput) -> ResponseType:
        return await x_views.view_update_activity(info, input)

    @strawberry.mutation(description="删除活动（级联删除报名）")
    async def delete_activity(self, info: Info, input: ActivityIdInput) -> ResponseType:
        return await x_views.view_delete_activity(info, input)

    @strawberry.mutation(description="Excel 批量排期上传（.xlsx，400 格式错误）")
    async def upload_activity(self, info: Info, input: UploadActivityInput) -> ResponseType:
        return await x_views.view_upload_activity(info, input)


import os as _os

_IS_PRODUCTION = _os.environ.get("IAO_ENV", "").lower() in ("production", "prod")

schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    config=StrawberryConfig(auto_camel_case=False),
    extensions=[
        QueryDepthLimiter(max_depth=8),
    ],
)
if _IS_PRODUCTION:
    from strawberry.extensions import DisableIntrospection
    schema.extensions.append(DisableIntrospection())


def register_routers(route_prefix: str) -> Router:
    controller = make_graphql_controller(
        schema,
        path="/graphql",
        graphql_ide=None,
        allow_queries_via_get=False,
    )
    return Router(path=route_prefix, route_handlers=[controller])
