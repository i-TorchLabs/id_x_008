# ID008 User Guide

**SME IAO Booking System (1v1 Consultation Booking Platform)**

> Designed for two roles — **Students** (regular users) and **Administrators** — covering the complete booking loop: **consultation topic publishing → time-slot scheduling → appointment booking → email reminders → cancellation & feedback → data export**.

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. The Two Roles and How to Log In](#2-the-two-roles-and-how-to-log-in)
- [3. Student Guide](#3-student-guide)
  - [3.1 Access and Login](#31-access-and-login)
  - [3.2 Browse Activities (List / Calendar)](#32-browse-activities-list--calendar)
  - [3.3 Book a Consultation](#33-book-a-consultation)
  - [3.4 View My Records and Cancel](#34-view-my-records-and-cancel)
  - [3.5 Automatic Email Reminders](#35-automatic-email-reminders)
  - [3.6 FAQ and Notes for Students](#36-faq-and-notes-for-students)
- [4. Administrator Guide](#4-administrator-guide)
  - [4.1 Log In to the Admin Panel](#41-log-in-to-the-admin-panel)
  - [4.2 Project Management](#42-project-management)
  - [4.3 Activity Management](#43-activity-management)
  - [4.4 Report Export](#44-report-export)
  - [4.5 Notes for Administrators](#45-notes-for-administrators)
- [5. Business Rules Quick Reference](#5-business-rules-quick-reference)
- [6. Frequently Asked Questions (FAQ)](#6-frequently-asked-questions-faq)

---

## 1. System Overview

This system is a **one-on-one consultation booking platform** provided by the **International Affairs Office (IAO), School of Management and Economics, The Chinese University of Hong Kong, Shenzhen**. It upgrades the booking process, which previously relied on manual coordination via email / WeChat, into a self-service online loop:

- **Students** browse activities online, select a consultation topic, and book; the system automatically sends email reminders;
- **Advisors** do not need to log in; they can keep track of their appointment schedule through email;
- **Administrators** publish consultation topics, arrange time slots, maintain quotas, and export booking data with one click.

The student and admin ends share the same website entry point and automatically route to the appropriate interface based on login identity.

---

## 2. The Two Roles and How to Log In

| Role | Login Method | First Page After Login | Key Capabilities |
|------|--------------|------------------------|------------------|
| **Student (Regular User)** | CUHK ADFS SSO login (recommended) or email registration | Activity list page (Activities) | Browse / book / cancel consultations |
| **Administrator** | Account + password | Project management page (Project Management) | Maintain projects, schedule, export reports |

> Note: The site's home page (`/`) automatically redirects to the login page (`/login`).

---

## 3. Student Guide

### 3.1 Access and Login

**Option 1: Student SSO Single Sign-On (recommended)**

On the login page, click the orange **Go Student Client** button. Your browser will be redirected to **CUHK Unified Authentication (ADFS)**:

1. Authenticate with your campus account (e.g., `@link.cuhk.edu.cn`);
2. After a successful authentication, you are automatically redirected back to the system, and **your profile is created automatically on first login** (no manual registration needed);
3. After logging in, you land on the **Activity List page**.

**Option 2: Email Registration and Login**

1. Click **Register** on the login page to switch to the registration form;
2. Fill in the following fields (all input boxes share the same width):
   - **Please input email**: use an **email address** as your username (required);
   - **Password**: must be **at least 8 characters**;
   - **Confirm password**: re-enter the password; it must match the one above;
   - **Name (optional)**: your name (optional);
   - **Student ID (optional)**: your student ID (optional);
3. Click **Register** to submit. Successful registration automatically logs you in and takes you to the Activity List page.

> Note: The password must be at least 8 characters long, and the two entries must match; otherwise the page will show the corresponding error message when you submit.

**Log out**: click the logout icon at the top-right of the student interface, confirm, and the system will clear the local session and redirect to the ADFS logout page.

---

### 3.2 Browse Activities (List / Calendar)

After entering the home page, you will see the **Activities List**. The page, from top to bottom, contains:

1. **Filter bar**: enter a title prefix in the `Title` input box and click **Search** to filter activities.
2. **Date bar**: shows today's date and day of the week.
3. **View switcher**: toggle between the "List" and "Calendar" views using the **List / Calendar** options.
   - **List view**: each row shows the activity name, date & time, status, occupied quota (booked/total) and an **Apply** button.
   - **Calendar view**: activities are displayed in a calendar format; click an activity to enter its booking page.

**State indicator (State) explanation**:

- **Open** (green): open for booking; click **Apply** to book;
- **Full** (red): all seats are taken; the **Apply** button is greyed out and cannot be clicked;
- **Closed** (grey): booking has ended or the activity has already started/ended; booking is not possible.

> Pagination: the bottom of the list has **Prev / Next** buttons and displays the current page number and total number of items.

---

### 3.3 Book a Consultation

Click **Apply** on an activity to enter its booking page, which contains:

1. **Activity details**: the activity name, the responsible advisor (**Advisor**) and the rich-text content description filled in by the administrator;
2. **Select a Topic**: choose from the following structured consultation topics (single selection):
   - Academic Planning
   - Exchange Application
   - Internship & Career
   - Graduate Application
   - Other

   > Topics already taken by other students are displayed with `(Occupied)` and greyed out, and cannot be selected.

3. After selecting a topic, click **Submit Application** to submit your booking.

**After a successful booking**, you are automatically redirected to the **My Records** page.

> Note: Each student can book **only once within the same ISO calendar week** (see §5 Business Rules). If you violate this rule, the system will show an error.

---

### 3.4 View My Records and Cancel

Click **My Records** at the top-right of the home page to enter the **My Booking Records** page:

- The record list shows: order number (**Order**), activity, consultation topic, activity time, and booking time;
- Click **Cancel** on a record to cancel the booking; the system will show a confirmation dialog;
- After confirmation, the seat is released so other students can book it again.

> Note: **Cancellation is forbidden within the 4 hours before the activity ends** (see §5 Business Rules).

---

### 3.5 Automatic Email Reminders

The system automatically sends you **booking-related emails** (sent from `careersme@cuhk.edu.cn`):

- **Student reminder**: sent at **21:00 on the day before the activity**, reminding you of the upcoming consultation;
- **Feedback questionnaire**: sent **2 hours after the activity ends** (deduplicated to prevent resends).

> Note: When you book / cancel, the system also immediately sends a notification email to the responsible advisor, so they can keep track of their schedule.

---

### 3.6 FAQ and Notes for Students

| Issue Faced | Explanation & Handling |
|-------------|------------------------|
| Forgot the password | The system does not yet provide self-service password recovery; please contact the administrator |
| Apply button is greyed out | The activity's status is **Full / Closed** and cannot be booked |
| "You can only book once in the same week" | You already have a booking this week; please choose an activity next week |
| "Booking has closed" | Booking stopped 24 hours before the activity starts |
| "Session expired" | Your login state has lapsed; please log in again |

---

## 4. Administrator Guide

> The following features are only visible and operable for administrators. The left menu consists of three pages: **Project / Activities / Report**.

### 4.1 Log In to the Admin Panel

On the login page, enter your **administrator account and password** (the account is configured by the deployment team) and click **Login**. The system routes you to the **admin panel** based on your account role (default landing on the project management page).

The admin interface contains: the logo at the top-left, **username + logout icon** at the top-right, the left menu, and a breadcrumb navigation bar at the top.

**Log out**: click the logout icon at the top-right and confirm to return to the login page.

---

### 4.2 Project Management

Used to maintain **consultation projects** (top-level categories, e.g., "1v1 Academic Consultation"). Enter the **Project** page:

- The table shows: ID, name (**Name**), quota (**Quota**), advisor (**Advisor**), update time, and actions;
- Click **New Project** to add a project. The form fields are:
  - **Project Name**: must be globally unique (duplicates cause an error);
  - **Quota**: the number of seats (a number);
  - **Advisor**: select the responsible advisor from the dropdown;
  - **Description**: a rich-text editor description of the project (shown on the student booking page);
- Each record's **Edit** lets you edit the project, and **Delete** lets you delete it;
  - ⚠️ Deleting a project **cascade-deletes all its activities and bookings; this cannot be undone**, and the system will show a second confirmation dialog.
- You can sort by ID (click the ID column header) and use Prev / Next pagination.

---

### 4.3 Activity Management

Used to arrange **specific consultation time slots** (which belong to a project). Enter the **Activities** page:

**① Create / Edit Activities**

- Click **New Activity**. The form fields are:
  - **Project**: select the parent project (required);
  - **Activity Name**: the activity name (if left blank, it defaults to the project name);
  - **Activity Start / End**: the start and end time of the activity itself;
  - **Application Start / End**: the opening and closing times for booking;
- Editing (**Edit**) works the same way and lets you modify the time fields.

**② Template Download and Batch Scheduling (recommended for large-scale scheduling)**

- Click **Download Template** to download the 14-day scheduling Excel template;
- Fill in the schedule in the template, then click **Batch Upload (.xlsx)** to upload it;
  - The system creates an **independent activity record for each row** of the template (one row = one record; rows with the same project and start time are not merged);
  - After the upload, it reports `Upload done: X succeeded, Y failed`.
- Only `.xlsx` format is supported; files that are too large or malformed will be rejected.

**③ View Booking Details and Share Activities**

- Each row's **Detail** lets you view the activity's booking details (order number, name, student ID, grade, email, consultation topic, booking time);
- **Address** opens the student booking page in a new tab for preview;
- **Copy Link** copies the student booking link, making it convenient to distribute to students through other channels.

**④ Delete Activities**: ⚠️ Deleting an activity **cascade-deletes its booking records and cannot be undone**; a second confirmation is required.

---

### 4.4 Report Export

Used to filter and export booking data by conditions. Enter the **Report** page:

1. Set the filter conditions:
   - **Activity Name**: enter an activity-name prefix; matching activity tags are suggested below;
   - **Start Time / End Time**: choose a time range;
2. **Select multiple activities**: click the activity-name tags to select / deselect (the selected count is shown in the title);
3. The **details table** at the bottom **updates in real time** with the filter conditions, so you can preview first;
4. Click **Export Excel** to export the booking data of the selected activities within the corresponding time range as an Excel file.

> Note: A student token can only query **his/her own** booking data, while administrators can query and export all data across activities.

---

### 4.5 Notes for Administrators

- The initial password of an administrator right after deployment is a **placeholder hash that cannot be used to log in**. Be sure to set a real password per the deployment documentation (README) and change it promptly after logging in.
- Project names must be unique; activities belong to a project, so deleting a project also deletes its activities and bookings.
- The activity status `Open / Full / Closed` is **automatically determined by the system based on quota and time**; no manual intervention is needed.

---

## 5. Business Rules Quick Reference

| Rule | Explanation |
|------|-------------|
| Per-week booking limit | Each student can book at most **1 time per ISO calendar week** |
| Booking deadline | Booking stops **24 hours before the activity starts** |
| Cancellation deadline | **No cancellation within 4 hours before the activity ends** |
| Quota limit | When bookings reach the quota, the status becomes **Full**; a Quota of "N/A" means unlimited |
| State machine | **Open → Full → Closed** automatically |
| Activity status determination | Booking not open / already closed / activity started or ended → **Closed** |
| Order number | The system auto-generates an order number of **R + 8 digits** |
| Email reminders | Both advisors and students receive a reminder at 21:00 the day before; a feedback questionnaire is sent 2 hours after the activity ends (deduplicated) |
| Registration password | At least **8 characters**, and the two entries must match |

---

## 6. Frequently Asked Questions (FAQ)

**Q1: Do students have to log in via SSO?**
Not necessarily. We recommend CUHK ADFS single sign-on (profile is auto-created), but you can also register and log in with an email + password.

**Q2: What should I do if the system says "You can only book once in the same week"?**
You already have a booking this week. Please choose an activity next week, or first cancel this week's booking on the **My Records** page and then book again.

**Q3: Why can't I click the Apply button?**
The activity status is `Full` (all seats taken) or `Closed` (booking closed / not open). Please choose an activity with the status `Open`.

**Q4: What are the restrictions on canceling a booking?**
You cannot cancel within the 4 hours before the activity ends; after canceling, the seat is automatically released to other students.

**Q5: I'm an administrator but can't find a certain page.**
Please confirm that your account role is an administrator, and check the left menu (Project / Activities / Report) after logging in.

**Q6: How do I troubleshoot a failed batch schedule upload?**
Make sure the file is `.xlsx`, does not exceed the size limit, and is filled out using the **template format** downloaded from the system.

**Q7: How soon will I receive emails?**
Booking / cancellation emails are sent immediately; reminder emails are sent at 21:00 the day before the activity; the feedback questionnaire is sent 2 hours after the activity ends.

---

