# Class & Attendance Feature Plan

## Phase 1 – Domain Modeling & Storage ✅

- `classroom_models.py` now defines `Classroom` and `StudentProfile` dataclasses plus serialization helpers.
- `classroom_service.py` introduces repository-backed CRUD operations (JSON or DB) with uniqueness validation for class names and roll numbers.
- JSON persistence (`classes_data.json`) stores mock classes and rosters; Config exposes `CLASSES_FILE` for overrides.
- Database layer gained `ClassroomModel`/`StudentModel` tables plus `DatabaseClassroomRepository` for parity with JSON storage.
- Unit tests in `tests/test_classroom_service.py` cover creation, duplicate prevention, and seed loading to keep regressions in check.

## Phase 2 – API & Backend Logic

- Expose REST (or GraphQL) endpoints to:
  - create/list classes
  - register students for a class
  - retrieve class roster for attendance entry
- Implement server-side validation for maximum student count and roll-number uniqueness.
- Add integration tests that hit the new endpoints using representative payloads.

## Phase 3 – Frontend Home Page Integration

- Update `frontend/src/App.tsx` (or relevant page) to fetch and display class cards on the home screen.
- Add “Create Class” flow:
  - teacher specifies class name and expected student count
  - dynamically render `n` rows of inputs for `student name` + `roll number`
  - submit to backend and show success/error feedback
- Provide “Take Attendance” button per class that routes to the existing attendance component preloaded with the selected class.
- Ensure UI components use existing design system (`components/ui/*`) for consistency and accessibility.

## Phase 4 – Attendance Workflow Enhancement

- When a teacher selects a class, auto-load the class roster into the attendance view.
- Restrict attendance actions to the selected class, preventing cross-class data leakage.
- Store submitted attendance records against the specific class instance in the backend.
- Add confirmation/state indicators so teachers know which class is active.

## Phase 5 – QA, Docs, and Release

- Write end-to-end scenarios covering class creation, roster entry, and attendance submission.
- Document the new APIs and frontend flows in `ROADMAP.md` or a dedicated section.
- Update `CHANGELOG.md` with the feature summary once merged.
- Coordinate deployment steps (migrations, config toggles) before release.
