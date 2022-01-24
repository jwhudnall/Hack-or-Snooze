# Hack-or-Snooze
A Hacker News clone, part of Springboard's Software Engineering Bootcamp.

### Under the hood
- If not logged in, the home page displays posts in chronological order.
- If logged in, the home page is updated to reflect the user's current favorite posts, and personal posts.
  - If a user logs in with an incorrect password, they are notified.
  - If a user tries to create an account whose username has already been used, they are notified.
- Clicking **submit** prompts the user to post a new story. Upon submission, this is added to the home page.
- Clicking **favorites** filters stories to only include those starred by the user.
