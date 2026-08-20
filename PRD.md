# Project Management Platform

## Backend

### 1. Product Overview

Collaborative project management platform. The system enables teams to organize projects, manage tasks with subtasks, maintain project notes, and handle user authentication with role-based access control.

### 2. Target Users

- **Project Administrators:** Create and manage projects, assign roles, oversee all project activities
- **Project Admins:** Manage tasks and project content within assigned projects
- **Team Members:** View projects, update task completion status, access project information

### 3. Core Features

- **User Registration:** Account creation with email verification
- **User Login:** Secure authentication with JWT tokens
- **Password Management:** Change password, forgot/reset password functionality
- **Email Verification:** Account verification via email tokens
- **Token Management:** Access token refresh mechanism
- **Role-Based Access Control:** Three-tier permission system (Admin, Project Admin, Member)

#### 3.2 Project Management

- **Project Creation:** Create new projects with name and description
- **Project Listing:** View all projects user has access to with member count
- **Project Details:** Access individual project information
- **Project Updates:** Modify project information (Admin only)
- **Project Deletion:** Remove projects (Admin only)
