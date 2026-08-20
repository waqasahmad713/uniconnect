from datetime import datetime, timezone
from enum import Enum


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    STUDENT = "student"
    ALUMNI = "alumni"
    FACULTY = "faculty"
    OTHER = "other"


class PostType(str, Enum):
    IDEA = "idea"
    QUESTION = "question"
    DISCUSSION = "discussion"
    RESOURCE = "resource"
    JOB = "job"
    INTERNSHIP = "internship"
    COLLABORATION = "collaboration"


class ConnectionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class OpportunityType(str, Enum):
    JOB = "job"
    INTERNSHIP = "internship"
    PROJECT = "project"
    RESEARCH = "research"
    FREELANCE = "freelance"


class WorkMode(str, Enum):
    REMOTE = "remote"
    ONSITE = "on-site"
    HYBRID = "hybrid"


class ReportReason(str, Enum):
    SPAM = "spam"
    HARASSMENT = "harassment"
    SCAM = "scam"
    FAKE_PROFILE = "fake_profile"
    INAPPROPRIATE = "inappropriate"
    OTHER = "other"


class ReportTargetType(str, Enum):
    POST = "post"
    COMMENT = "comment"
    USER = "user"


class ReportStatus(str, Enum):
    PENDING = "pending"
    DISMISSED = "dismissed"
    ACTIONED = "actioned"


class NotificationType(str, Enum):
    CONNECTION_REQUEST = "connection_request"
    CONNECTION_ACCEPTED = "connection_accepted"
    POST_LIKE = "post_like"
    NEW_COMMENT = "new_comment"
    COMMENT_REPLY = "comment_reply"
    NEW_MESSAGE = "new_message"
    OPPORTUNITY_UPDATE = "opportunity_update"
    EVENT_REMINDER = "event_reminder"
