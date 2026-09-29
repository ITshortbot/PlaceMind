from app.database.models import ATSMatchScore, JobDescription, JobRequirement, Resume, ResumeSection


def test_foreign_keys_define_database_delete_actions():
    foreign_keys = {
        "resume.user_id": (Resume.__table__.c.user_id, "CASCADE"),
        "resume_section.resume_id": (ResumeSection.__table__.c.resume_id, "CASCADE"),
        "job_description.user_id": (JobDescription.__table__.c.user_id, "SET NULL"),
        "job_requirement.job_id": (JobRequirement.__table__.c.job_id, "CASCADE"),
        "ats_match_score.resume_id": (ATSMatchScore.__table__.c.resume_id, "CASCADE"),
        "ats_match_score.job_id": (ATSMatchScore.__table__.c.job_id, "CASCADE"),
    }

    for column, expected_action in foreign_keys.values():
        foreign_key = next(iter(column.foreign_keys))
        assert foreign_key.ondelete == expected_action