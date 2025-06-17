# AI Title Generation Feature

This document explains the AI-powered task title generation feature in Yellow Claude Orchestra.

## Overview

The system now automatically generates concise, meaningful titles for tasks when:
- Users only provide a description without a title
- The provided title is too long or is the same as the description

## How It Works

1. **User Input**: Users can now focus on describing what they want in the main text area
2. **Title Generation**: When a task is created without a proper title, the system:
   - Uses OpenAI's GPT-3.5-turbo to generate a concise title (15 characters or less)
   - Falls back to extracting keywords from the description if OpenAI is not available
   - Ensures titles are action-oriented and end with a verb in Japanese

3. **Fallback Logic**: If OpenAI API is not configured:
   - Extracts the first sentence or meaningful keywords
   - Limits to 20 characters
   - Adds "の実装" (implementation) suffix when appropriate

## Configuration

### OpenAI API Key (Optional)

To enable AI-powered title generation:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

3. Restart the web dashboard:
   ```bash
   npm run dev
   ```

**Note**: The system works without an OpenAI API key using the fallback logic.

## User Interface Changes

### QuickTaskForm
- Main input is now a textarea for task description
- Optional "詳細設定" (Advanced Settings) for custom titles
- Auto-generates title from description when not provided

### Example Usage

**Before**: Users had to think of both a title and description
```
Title: "GitHubイシュー一覧表示"
Description: "GitHubのイシュー一覧を表示して、各イシューの状態やラベルが見えるようにしてください"
```

**After**: Users can just describe what they want
```
Description: "GitHubのイシュー一覧を表示して、各イシューの状態やラベルが見えるようにしてください"
Generated Title: "イシュー一覧を表示する"
```

## Technical Implementation

### Files Modified

1. **`/src/utils/ai.ts`** (New)
   - `generateTaskTitle()`: Main title generation function
   - `isValidTitle()`: Validates if a title needs regeneration
   - Fallback logic for when OpenAI is unavailable

2. **`/src/app/api/tasks/route.ts`**
   - Modified POST endpoint to generate titles when needed
   - Validates existing titles before using them

3. **`/src/components/modern/QuickTaskForm.tsx`**
   - Changed UI to focus on description input
   - Made title optional with advanced settings

4. **`/src/app/page.tsx`**
   - Updated to handle optional titles in task submission

## Benefits

1. **Better UX**: Users can quickly describe tasks without thinking about titles
2. **Consistency**: AI generates consistent, concise titles
3. **Flexibility**: Users can still provide custom titles if desired
4. **No Hard Dependency**: Works without OpenAI API using smart fallbacks