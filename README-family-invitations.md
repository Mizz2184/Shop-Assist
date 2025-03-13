# Family Invitation System

This document explains the implementation of the family invitation system in Shop-Assist.

## Overview

The family invitation system allows users to invite others to join their family groups. The system includes:

1. API endpoints for creating, retrieving, accepting, and rejecting invitations
2. Email notifications for invitations
3. A user interface for viewing and responding to invitations
4. Database functions for handling invitation acceptance

## Components

### 1. Email Service

The email service (`src/lib/emailService.ts`) provides functionality for sending invitation emails. It attempts to use the Loops.so API but falls back to logging the email content if the API call fails.

To set up a real email service:
- Create an account with an email service provider (Loops.so, SendGrid, Mailgun, etc.)
- Update the email service implementation to use your provider's API
- Set the appropriate environment variables

### 2. API Endpoints

#### Creating Invitations

The `POST` function in `src/app/api/family/invitations/route.ts` handles creating new invitations:
- Validates the request data
- Checks if the user is an admin of the family group
- Checks if the invited user is already a member or has a pending invitation
- Creates a new invitation in the database
- Sends an email notification to the invited user

#### Retrieving Invitations

The `GET` function in `src/app/api/family/invitations/[id]/route.ts` retrieves invitation details:
- Fetches the invitation from the database
- Checks if the invitation has expired
- Returns the invitation details

#### Accepting/Rejecting Invitations

The `PATCH` function in `src/app/api/family/invitations/[id]/route.ts` handles accepting or rejecting invitations:
- Validates the request data
- Checks if the invitation exists and is still valid
- Checks if the user is authorized to respond to the invitation
- Calls the database function to handle invitation acceptance
- Updates the invitation status for rejections

### 3. Database Functions

The `handle_invitation_acceptance` function (`src/scripts/create-invitation-acceptance-function.sql`) handles invitation acceptance in a transaction:
- Gets the invitation details
- Checks if the invitation exists and is pending
- Checks if the user is already a member of the family
- Adds the user to the family if they're not already a member
- Updates the invitation status

### 4. User Interface

The invitation page (`src/app/family/invitations/[id]/page.tsx`) provides a user interface for viewing and responding to invitations:
- Fetches the invitation details
- Displays information about the invitation (family name, inviter, role, expiration date)
- Provides buttons for accepting or rejecting the invitation
- Handles authentication and redirects as needed

### 5. Authentication Handling

The `AuthRedirect` component (`src/components/auth/AuthRedirect.tsx`) handles pending invitations after login:
- Checks if there's a pending invitation in localStorage
- Sends a request to accept or reject the invitation if needed
- Redirects the user to the appropriate page

## How to Use

### Sending Invitations

To send an invitation:
1. Navigate to the Family page
2. Select the Members tab
3. Enter the email address of the person you want to invite
4. Select the role you want to assign them
5. Click "Send Invitation"

### Accepting Invitations

To accept an invitation:
1. Click the link in the invitation email
2. Log in if prompted
3. Review the invitation details
4. Click "Accept" to join the family group

### Rejecting Invitations

To reject an invitation:
1. Click the link in the invitation email
2. Log in if prompted
3. Review the invitation details
4. Click "Decline" to reject the invitation

## Troubleshooting

If you encounter issues with the invitation system:

1. Check that the SQL function for handling invitation acceptance has been created in the database
2. Verify that the email service is properly configured
3. Check the server logs for any errors related to invitation creation or acceptance
4. Ensure that the user has the necessary permissions to send invitations

## Future Improvements

Potential improvements to the invitation system:

1. Implement a real email service integration
2. Add support for resending invitations
3. Add expiration date extension for pending invitations
4. Implement invitation tracking and analytics
5. Add support for bulk invitations 