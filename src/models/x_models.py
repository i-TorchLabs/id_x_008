"""数据层：ORM 模型 + Base + 全局会话工厂（引擎启动时注入，或由 utils.database_client 创建）。"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


_session_maker: async_sessionmaker[AsyncSession] | None = None


def set_session_maker(maker: async_sessionmaker[AsyncSession]) -> None:
    global _session_maker
    _session_maker = maker


def get_session() -> async_sessionmaker[AsyncSession]:
    global _session_maker
    if _session_maker is None:
        # 独立运行（python x_plugin.py / scripts）时按需创建
        from ...utils.database_client import get_session_maker
        _session_maker = get_session_maker()
    return _session_maker


# ===== 业务模型区（SME IAO 预约系统，iao_enlist_* 表族） =====


class IaoEnlistUser(Base):
    __tablename__ = "iao_enlist_user"
    __table_args__ = {"comment": "用户表"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    username: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="用户名")
    password: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="密码")
    role: Mapped[str] = mapped_column(String(255), nullable=False, default="user", comment="角色")
    key: Mapped[str] = mapped_column(Text, nullable=False, default="N/A", comment="密钥")
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="姓名")
    grade: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="年级")
    number: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="学号")
    email: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="邮箱")
    time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.now, comment="时间")

    _SAFE_FIELDS = {"id", "username", "role", "name", "grade", "number", "email", "time"}

    def to_dict(self) -> dict:
        """序列化为字典，排除敏感字段 password 与 key（Token）。"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name in self._SAFE_FIELDS}


class IaoEnlistContent(Base):
    __tablename__ = "iao_enlist_content"
    __table_args__ = {"comment": "内容表"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    content: Mapped[str] = mapped_column(Text, nullable=False, default="N/A", comment="内容")
    time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.now, comment="时间")


class IaoEnlistProject(Base):
    __tablename__ = "iao_enlist_project"
    __table_args__ = {"comment": "项目表"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", unique=True, comment="名称")
    quota: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="名额")
    content: Mapped[str] = mapped_column(Text, nullable=False, default="N/A", comment="内容")
    content_ex_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("iao_enlist_content.id"), nullable=True, comment="内容扩展ID"
    )
    owner: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="拥有者")
    update: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.now, comment="更新")
    time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.now, comment="时间")

    _SAFE_FIELDS = {"id", "name", "quota", "content", "content_ex_id", "owner", "update", "time"}

    def to_dict(self) -> dict:
        """序列化为字典，通过 _SAFE_FIELDS 白名单显式控制字段暴露。"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name in self._SAFE_FIELDS}


class IaoEnlistActivity(Base):
    __tablename__ = "iao_enlist_activity"
    __table_args__ = {"comment": "活动表"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="名称")
    project_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("iao_enlist_project.id"), nullable=True, comment="项目ID"
    )
    activity_start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="活动开始时间")
    activity_end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="活动结束时间")
    apply_start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="报名开始时间")
    apply_end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="报名结束时间")
    time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.now, comment="时间")
    update: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.now, comment="更新")


class IaoEnlistApply(Base):
    __tablename__ = "iao_enlist_apply"
    __table_args__ = {"comment": "报名表"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    project_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("iao_enlist_project.id"), nullable=True, comment="项目ID"
    )
    activity_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("iao_enlist_activity.id"), nullable=True, comment="活动ID"
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="用户ID")
    order: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="订单号")
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="姓名")
    number: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="学号")
    grade: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="年级")
    email: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="邮箱")
    time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.now, comment="时间")
    state: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="状态")
    info_1: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="信息1（咨询话题）")
    info_2: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="信息2")
    info_3: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="信息3")
    info_4: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="信息4")
    info_5: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="信息5")
    info_6: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="信息6")
    info_7: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="信息7")
    info_8: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="信息8")
    send_question: Mapped[str] = mapped_column(String(255), nullable=False, default="False", comment="发送问卷调查")


class IaoHtmlTemplate(Base):
    __tablename__ = "iao_html_template"
    __table_args__ = {"comment": "HTML模板"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    type: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="类型")
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="名称")
    html: Mapped[str] = mapped_column(Text, nullable=False, default="N/A", comment="HTML")


class IaoOwnerInfo(Base):
    __tablename__ = "iao_owner_info"
    __table_args__ = {"comment": "顾问信息"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="名称")
    email: Mapped[str] = mapped_column(String(255), nullable=False, default="N/A", comment="邮箱")
