import asyncHandler from '../utils/asyncHandler.js';
import * as companionService from '../services/companion.service.js';

export const encouragement = asyncHandler(async (req, res) => {
  const message = await companionService.getEncouragement(req.user.id);
  res.json({ message });
});

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await companionService.listConversations(req.user.id);
  res.json({ conversations });
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await companionService.getConversationMessages(req.user.id, req.params.id);
  res.json({ messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const result = await companionService.sendMessage(req.user.id, req.body);
  res.status(201).json(result);
});
