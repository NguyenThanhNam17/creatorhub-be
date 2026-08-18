# Project Coding Rules & Workflow Constraints

Before generating or writing any code, the agent MUST always perform the following steps:

1. **Search the codebase** using grep/find to understand if similar logic already exists.
2. **Find similar implementations** to extract existing design patterns.
3. **Reuse existing code**, helpers, utilities, and models whenever possible instead of creating duplicates.
4. **Explain what files will change** before writing any code.
5. **Explain why** those files need to be modified.
6. **Mention possible side effects** of the planned code modifications.
7. **Wait for confirmation** from the user before executing any large or architectural changes.
8. **Never generate code directly** without performing and presenting this analysis phase first.
