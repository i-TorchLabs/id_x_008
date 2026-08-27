# -*- coding: utf-8 -*-
"""学生提醒邮件脚本（cron：每日 21:00）。

扫描"明天开始"的活动报名记录，向报名学生发送提醒邮件。
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


async def run() -> None:
    now = datetime.now()
    day_start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    maker = get_session()
    async with maker() as session:
        result = await session.execute(select(AaEnlistApply, AaEnlistActivity).join(
            AaEnlistActivity, AaEnlistApply.activity_id == AaEnlistActivity.id
        ).where(
            AaEnlistActivity.activity_start_time >= day_start,
            AaEnlistActivity.activity_start_time < day_end,
        ))
        for apply_obj, activity in result.all():
            try:
                subject = "Activity reminder: tomorrow"
                html = (
                    f"<p>Dear {apply_obj.name},</p>"
                    f"<p>您预约的咨询活动「{activity.name}」将于明日 "
                    f"{activity.activity_start_time.strftime('%H:%M') if activity.activity_start_time else ''} "
                    f"开始，订单号 {apply_obj.order}，请准时参加。</p>"
                )
                _send_mail(subject, MAIL_FROM, apply_obj.email, "", html)
                logger.info(f"学生提醒邮件已处理: to={apply_obj.email} order={apply_obj.order}")
            except Exception as e:
                logger.error(f"学生提醒邮件处理失败（apply={apply_obj.id}）: {e}")


if __name__ == "__main__":
    asyncio.run(run())
