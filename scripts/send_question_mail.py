# -*- coding: utf-8 -*-
"""反馈问卷邮件脚本（cron：每 2 小时）。

扫描"活动结束已满 2 小时"且尚未发送问卷（send_question != 'True'）的报名记录，
向学生发送反馈问卷邮件并回写 send_question='True' 去重防重发。
邮件统一从 careersme@cuhk.edu.cn 发出；发送失败仅记录日志。
"""
from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from sqlalchemy import select  # noqa: E402

from x_models.id_x_008.src.models.x_models import (  # noqa: E402
    AaEnlistActivity,
    AaEnlistApply,
    get_session,
)
from x_models.id_x_008.src.views.x_views import MAIL_FROM, _send_mail  # noqa: E402
from x_models.id_x_008.utils.log_util import logger  # noqa: E402

QUESTIONNAIRE_URL = "https://sme-activity-apply.cuhk.edu.cn/questionnaire"


async def run() -> None:
    threshold = datetime.now() - timedelta(hours=2)

    maker = get_session()
    async with maker() as session:
        result = await session.execute(select(AaEnlistApply, AaEnlistActivity).join(
            AaEnlistActivity, AaEnlistApply.activity_id == AaEnlistActivity.id
        ).where(
            AaEnlistActivity.activity_end_time <= threshold,
            AaEnlistApply.send_question != "True",
        ))
        for apply_obj, activity in result.all():
            try:
                subject = "We value your feedback"
                html = (
                    f"<p>Dear {apply_obj.name},</p>"
                    f"<p>感谢您参加咨询活动「{activity.name}」（订单号 {apply_obj.order}）。"
                    f"诚邀您填写反馈问卷：<a href=\"{QUESTIONNAIRE_URL}\">{QUESTIONNAIRE_URL}</a></p>"
                )
                if _send_mail(subject, MAIL_FROM, apply_obj.email, "", html):
                    apply_obj.send_question = "True"
                    await session.commit()
                    logger.info(f"反馈问卷邮件已发送: to={apply_obj.email} order={apply_obj.order}")
            except Exception as e:
                logger.error(f"反馈问卷邮件处理失败（apply={apply_obj.id}）: {e}")
                await session.rollback()


if __name__ == "__main__":
    asyncio.run(run())
