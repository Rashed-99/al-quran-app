import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import * as groupsApi from '@/api/groups';
import { createPageUrl } from '@/utils';
import { 
  Users, 
  Plus, 
  Copy, 
  Trophy,
  Loader2,
  ChevronRight,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Backend already scopes this to groups the current user is a
      // member of - no client-side filtering needed anymore.
      const myGroups = await groupsApi.listGroups();
      setGroups(myGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      // invite_code generation now happens server-side (see groups.service.js).
      await groupsApi.createGroup({ name: newGroupName.trim() });

      toast.success('Group created!');
      setNewGroupName('');
      setCreateDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;

    try {
      const group = await groupsApi.joinGroup(joinCode.trim().toUpperCase());
      toast.success(`Joined ${group.name}!`);
      setJoinCode('');
      setJoinDialogOpen(false);
      loadData();
    } catch (error) {
      // Distinguish "bad code" from other failures where possible.
      toast.error(error?.data?.error || 'Failed to join group');
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Groups</h1>
          <p className="text-slate-500 dark:text-slate-400">Compete with friends to read more Quran</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl py-6">
                <Plus className="w-5 h-5 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Create a Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
                <Button 
                  onClick={createGroup} 
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={!newGroupName.trim()}
                >
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 rounded-xl py-6 dark:border-slate-700 dark:text-white">
                <Users className="w-5 h-5 mr-2" />
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Join a Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Enter invite code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white uppercase"
                  maxLength={6}
                />
                <Button 
                  onClick={joinGroup} 
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={!joinCode.trim()}
                >
                  Join
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-violet-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-2">No groups yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Create or join a group to start competing!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => navigate(createPageUrl(`GroupDetail?id=${group.id}`))}
                  className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 dark:text-white">{group.name}</p>
                          {group.admin_id === user?.id && (
                            <Crown className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {group.member_count || 1} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyInviteCode(group.invite_code);
                        }}
                        className="text-slate-400 hover:text-violet-600"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
