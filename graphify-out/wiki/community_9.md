# Community 9: CoAuthor Chat Components

This community represents the **CoAuthor Chat Components** functional module of the VibeNovel v2 system.

## Community Members
| Node / Symbol | Type | Source File | Location |
| --- | --- | --- | --- |
| `AiMessageBubble()` | **CODE** | `src/components/chat/AiMessageBubble.tsx` | L19 |
| `AiMessageBubble.tsx` | **CODE** | `src/components/chat/AiMessageBubble.tsx` | L1 |
| `AiMessageBubbleProps` | **CODE** | `src/components/chat/AiMessageBubble.tsx` | L4 |
| `ApprovalCard()` | **CODE** | `src/components/chat/ApprovalCard.tsx` | L12 |
| `ApprovalCard.tsx` | **CODE** | `src/components/chat/ApprovalCard.tsx` | L1 |
| `ApprovalCardProps` | **CODE** | `src/components/chat/ApprovalCard.tsx` | L3 |
| `CoAuthorChat()` | **CODE** | `src/components/chat/CoAuthorChat.tsx` | L11 |
| `CoAuthorChat.tsx` | **CODE** | `src/components/chat/CoAuthorChat.tsx` | L1 |
| `CoAuthorChatProps` | **CODE** | `src/components/chat/CoAuthorChat.tsx` | L7 |
| `useChatStore` | **CODE** | `src/store/useChatStore.ts` | L73 |

## Intra-Community Relationships
These symbols have structural or semantic relationships within this community:
- `AiMessageBubble.tsx` --**imports_from**--> `ApprovalCard.tsx` _(EXTRACTED)_
- `AiMessageBubble.tsx` --**imports**--> `ApprovalCard()` _(EXTRACTED)_
- `AiMessageBubble.tsx` --**contains**--> `AiMessageBubbleProps` _(EXTRACTED)_
- `AiMessageBubble.tsx` --**contains**--> `AiMessageBubble()` _(EXTRACTED)_
- `CoAuthorChat.tsx` --**imports_from**--> `AiMessageBubble.tsx` _(EXTRACTED)_
- `CoAuthorChat.tsx` --**imports**--> `AiMessageBubble()` _(EXTRACTED)_
- `ApprovalCard.tsx` --**contains**--> `ApprovalCardProps` _(EXTRACTED)_
- `ApprovalCard.tsx` --**contains**--> `ApprovalCard()` _(EXTRACTED)_
- `CoAuthorChat.tsx` --**imports**--> `useChatStore` _(EXTRACTED)_
- `CoAuthorChat.tsx` --**contains**--> `CoAuthorChatProps` _(EXTRACTED)_
- `CoAuthorChat.tsx` --**contains**--> `CoAuthorChat()` _(EXTRACTED)_
- `CoAuthorChat()` --**calls**--> `useChatStore` _(EXTRACTED)_

## Cross-Community Bridges
These connections cross the boundary between this community and other system modules:
- `CoAuthorChat.tsx` --**imports_from**--> `useChatStore.ts` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))
- `CoAuthorChat.tsx` --**imports_from**--> `useProjectStore.ts` (links to [Community 1: Story Compass & Projects](community_1.md))
- `CoAuthorChat.tsx` --**imports**--> `useProjectStore` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `Workspace.tsx` --**imports_from**--> `CoAuthorChat.tsx` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `Workspace.tsx` --**imports**--> `CoAuthorChat()` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `CoAuthorChat()` --**calls**--> `useProjectStore` (links to [Community 0: Workspace & UI Theme Sync](community_0.md))
- `useChatStore.ts` --**contains**--> `useChatStore` (links to [Community 6: CoAuthor Chat & Brainstorming](community_6.md))

---
[← Back to Wiki Home](index.md)