import asyncHandler from '../utils/asyncHandler.js';
import * as groupsService from '../services/groups.service.js';

export const list = asyncHandler(async (req, res) => {
  const groups = await groupsService.listMyGroups(req.user.id);
  res.json({ groups });
});

export const create = asyncHandler(async (req, res) => {
  const group = await groupsService.createGroup(req.user.id, req.body);
  res.status(201).json({ group });
});

export const join = asyncHandler(async (req, res) => {
  const group = await groupsService.joinGroup(req.user.id, req.body.inviteCode);
  res.json({ group });
});

export const detail = asyncHandler(async (req, res) => {
  const group = await groupsService.getGroupDetail(req.user.id, req.params.id);
  res.json({ group });
});

export const progress = asyncHandler(async (req, res) => {
  const progress = await groupsService.getGroupProgress(req.user.id, req.params.id, req.query);
  res.json({ progress });
});

export const leaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await groupsService.getLeaderboard(req.user.id, req.params.id, req.query);
  res.json({ leaderboard });
});
