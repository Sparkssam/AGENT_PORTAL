# Document retention and deletion — Kinetic Agent Portal

This policy is **in effect**. Automated deletion does not run on a schedule. A final approver (`super_admin`) can preview and purge eligible records from Admin → Settings.

## Scope

- Application records in Postgres (`applications`, related documents metadata)
- Files in Supabase Storage bucket `application-documents`
- Audit log rows (approvals, rejections, uploads, downloads, sign-in events)
- In-app notifications and application comment threads

## Periods

| Record | Retention | What happens after |
| --- | --- | --- |
| Completed (verified) applications and documents | 7 years after completion | Files removed; personal details anonymised; case shell kept for reporting |
| Rejected applications and their files | 24 months after rejection | Files removed; personal details anonymised; status kept as Rejected |
| Abandoned drafts (never submitted) | 12 months after last update | Application and files deleted |
| Soft-deleted documents (`deleted_at` set) | 90 days | Storage object is already removed when the file is deleted in the portal |
| Audit / activity log | 7 years | Never purged with applications |
| Comment threads | Follow the parent application | Deleted with drafts; removed when a closed case is anonymised |

## Decisions locked in

1. Periods are the table above.
2. Closed cases are **anonymised** (ID, TIN, phone, address, names) rather than fully deleted, so counts still work.
3. Only a **final approver** may run a purge. There is no cron job.
4. Settings shows a **dry-run count** before you confirm Purge eligible records. Each run handles up to 50 drafts and 50 closed cases.

Staff idle timeout remains 30 minutes.
