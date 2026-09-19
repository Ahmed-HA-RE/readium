# Feature

---

**Name**: Adding Feature

**Description**: This skill is to add a new feature to the application

**Hints**: load | start | review | explain | complete

---

## If `load` hint is provided, then make sure to follow the steps below:

- Make sure either uploaded feature file is uploaded successfully, is accessible to you, and you can read it or a provided feature description is provided. If not, please ask to re-upload the file or provide a feature description.

- If the feature file is provided, make sure the feature file is in a valid **.md** format and is not corrupted and is not empty. If not, please ask to re-upload the file.

- Once the feature is successfully loaded, navigate to @/context/current-feature.md file and update the comments section with the following information:

  - **Feature Name**: [Name of the feature]

  - **Feature Description**: [Description of the feature]

  - **Feature Goals**: [Goals of the feature]

  - **Feature Status**: Not Started

  - **History**: keep it untoched

## If `start` hint is provided, then make sure to follow the steps below:

- Navigate to @/context/current-feature.md file and update the status section with **In Progress**. Make sure you can read the file first. If you cannot read the file, please ask me.

- Once the status is updated, create new branch eg. `feature/[feature-name]` and start working on the feature.

## If `review` hint is provided, then make sure to follow the steps below:

- Make sure the feature is completed and ready for review. If not, please ask to use the skill hint `start` to start working on the feature first.

- Once the feature is completed, start by reviewing the code changes made in the feature branch. Make sure to check for code quality, functionality, and adherence to the goals of the feature.

- Make sure there are no errors or warnings in the code. If there are any, mention them in the review and ask the developer to fix them or suggest improvements.

## If `explain` hint is provided, then make sure to follow the steps below:

- Explain the feature in detail, including its purpose, functionality, and how it fits into the overall application. Make sure to provide examples and use cases to help the developer understand the feature better.

## If `test` hint is provided, then make sure to follow the steps below:

- Only run this hint after the feature is complete. If not, ask the developer to use the `start` hint first.

- If the feature uses mutating operations (create, update, delete), test all of them and verify:

  - Data is saved correctly in the database

  - UI reflects the change without a full page reload

  - Error states are handled correctly

  - If there are any issues, mention them and suggest improvements

- If the feature uses read operations:

Read operations are always served by a **NestJS endpoint** (controller → service → Prisma). Test the endpoint itself first: the route is registered, the `@Roles`/guards reject unauthorized callers, the returned shape matches the interface declared in `packages/types`, and the Prisma query (filters, pagination, concurrency) is correct.

  **Note**: Run the test with **Jest** (the backend test runner, configured in `apps/backend/package.json`) via `pnpm test`, and make sure to write unit tests for the feature if not already written.

- If the feature involves the frontend, make sure the UI/UX is tested thoroughly, including responsiveness, accessibility, and interaction states by running the **Playwright** mcp server.

## If `complete` hint is provided, then make sure to follow the steps below:

- Once the feature is completed and reviewed, navigate to `@/context/current-feature.md` and update the **Status** section to **Completed**. Then, update the **History** section with details about the implemented feature.
- Make sure you can read the file before making any changes. If you cannot read the file, ask me for assistance.
- Then, push the current branch, but **ask me for confirmation first**.
- After the branch has been pushed, check out the `main` branch and clear the comments section.

* Make sure to merge the feature branch into the main branch and then checkout the main branch and delete the feature branch after the merge is successful. If there are any conflicts during the merge process, make sure to resolve them before merging.

* After merging the feature branch into the main branch, push to the remote repository.

**if no hint is provided infer that i must upload the feature file first then i run a hint like: `/feature/[hint]`**. Or, if there are no feature file uploaded nor feature description provided, then ask to upload the feature file or provide a feature description first before running any hint.
