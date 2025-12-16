import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '../../hooks/use-toast';
import { 
  Users, Search, Shield, Crown, UserCog, Mail, Calendar, 
  ChevronLeft, ChevronRight, RefreshCw, Edit2, Trash2,
  CheckCircle, XCircle, Star, Zap, UserPlus, AlertTriangle
} from 'lucide-react';

interface User {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  clerkId: string | null;
  createdAt: string;
  role: string | null;
  permissions: string[] | null;
  roleGrantedAt: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
}

interface RoleStats {
  byRole: { role: string; count: number }[];
  usersWithoutRole: number;
  totalUsers: number;
}

interface AvailableRole {
  value: string;
  label: string;
  description: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-slate-500/20 text-slate-300',
  creator: 'bg-orange-500/20 text-orange-300',
  professional: 'bg-purple-500/20 text-purple-300',
  enterprise: 'bg-yellow-500/20 text-yellow-300',
};

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-slate-500/20 text-slate-300',
  moderator: 'bg-blue-500/20 text-blue-300',
  support: 'bg-green-500/20 text-green-300',
  admin: 'bg-red-500/20 text-red-300',
};

const PLAN_NAMES: Record<string, string> = {
  free: 'Discover',
  creator: 'Elevate',
  professional: 'Amplify',
  enterprise: 'Dominate',
};

export function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // Role editing
  const [newRole, setNewRole] = useState('user');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  
  // Subscription editing
  const [newPlan, setNewPlan] = useState('creator');
  const [newDuration, setNewDuration] = useState('30');
  
  // New user form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  
  // Stats
  const [roleStats, setRoleStats] = useState<RoleStats | null>(null);
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
    loadRoleStats();
  }, [page, roleFilter, subscriptionFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(subscriptionFilter && { subscription: subscriptionFilter }),
      });
      
      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadRoleStats = async () => {
    try {
      const res = await fetch('/api/admin/roles', {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        setRoleStats(data.stats);
        setAvailableRoles(data.availableRoles);
        setAvailablePermissions(data.availablePermissions);
      }
    } catch (error) {
      console.error('Error loading role stats:', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setNewPermissions(user.permissions || []);
    setShowRoleModal(true);
  };

  const openSubscriptionModal = (user: User) => {
    setSelectedUser(user);
    setNewPlan(user.subscriptionPlan || 'creator');
    setNewDuration('30');
    setShowSubscriptionModal(true);
  };

  const saveRole = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole, permissions: newPermissions })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setShowRoleModal(false);
        loadUsers();
        loadRoleStats();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save role', variant: 'destructive' });
    }
  };

  const removeRole = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setShowRoleModal(false);
        loadUsers();
        loadRoleStats();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove role', variant: 'destructive' });
    }
  };

  const saveSubscription = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          plan: newPlan, 
          status: 'active',
          durationDays: parseInt(newDuration)
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setShowSubscriptionModal(false);
        loadUsers();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save subscription', variant: 'destructive' });
    }
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setShowDeleteModal(false);
        setSelectedUser(null);
        loadUsers();
        loadRoleStats();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const addUser = async () => {
    if (!newUserEmail) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newUserEmail,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          role: newUserRole
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setShowAddUserModal(false);
        setNewUserEmail('');
        setNewUserFirstName('');
        setNewUserLastName('');
        setNewUserRole('user');
        loadUsers();
        loadRoleStats();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add user', variant: 'destructive' });
    }
  };

  const togglePermission = (permission: string) => {
    setNewPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };


  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-blue-400">{roleStats?.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Admins</p>
                <p className="text-2xl font-bold text-red-400">
                  {roleStats?.byRole.find(r => r.role === 'admin')?.count || 0}
                </p>
              </div>
              <Crown className="h-8 w-8 text-red-400/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Support</p>
                <p className="text-2xl font-bold text-green-400">
                  {roleStats?.byRole.find(r => r.role === 'support')?.count || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Moderators</p>
                <p className="text-2xl font-bold text-purple-400">
                  {roleStats?.byRole.find(r => r.role === 'moderator')?.count || 0}
                </p>
              </div>
              <UserCog className="h-8 w-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-orange-500/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage users, roles, and permissions</CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { loadUsers(); loadRoleStats(); }}
                className="border-orange-500/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowAddUserModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>
            
            <Select value={roleFilter || 'all'} onValueChange={(v) => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={subscriptionFilter || 'all'} onValueChange={(v) => { setSubscriptionFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="none">No Subscription</SelectItem>
                <SelectItem value="free">Discover (Free)</SelectItem>
                <SelectItem value="creator">Elevate</SelectItem>
                <SelectItem value="professional">Amplify</SelectItem>
                <SelectItem value="enterprise">Dominate</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} className="bg-orange-500 hover:bg-orange-600">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Users Table */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  No users found
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-orange-500/30 transition gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                        {user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-slate-400 truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Role Badge */}
                      <Badge className={ROLE_COLORS[user.role || 'user']}>
                        {user.role || 'user'}
                      </Badge>
                      
                      {/* Subscription Badge */}
                      {user.subscriptionPlan && (
                        <Badge className={PLAN_COLORS[user.subscriptionPlan] || PLAN_COLORS.free}>
                          <Zap className="h-3 w-3 mr-1" />
                          {PLAN_NAMES[user.subscriptionPlan] || user.subscriptionPlan}
                        </Badge>
                      )}
                      
                      {/* Status */}
                      {user.subscriptionStatus === 'active' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : user.subscriptionStatus ? (
                        <XCircle className="h-4 w-4 text-red-400" />
                      ) : null}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoleModal(user)}
                        className="border-blue-500/30 hover:bg-blue-500/10"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Role
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSubscriptionModal(user)}
                        className="border-purple-500/30 hover:bg-purple-500/10"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Plan
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteModal(user)}
                        className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Showing {users.length} of {totalUsers} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Edit Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="bg-slate-900 border-orange-500/20">
          <DialogHeader>
            <DialogTitle className="text-orange-400">Edit User Role</DialogTitle>
            <DialogDescription>
              Assign role and permissions for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <p className="font-medium">{role.label}</p>
                        <p className="text-xs text-slate-400">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                {availablePermissions.map(permission => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={newPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <label
                      htmlFor={permission}
                      className="text-sm text-slate-300 cursor-pointer"
                    >
                      {permission.replace(/_/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={removeRole}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Role
            </Button>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveRole} className="bg-orange-500 hover:bg-orange-600">
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Edit Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="bg-slate-900 border-orange-500/20">
          <DialogHeader>
            <DialogTitle className="text-orange-400">Assign Subscription</DialogTitle>
            <DialogDescription>
              Manually assign a subscription plan for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Discover (Free)</SelectItem>
                  <SelectItem value="creator">Elevate ($59.99/mo)</SelectItem>
                  <SelectItem value="professional">Amplify ($99.99/mo)</SelectItem>
                  <SelectItem value="enterprise">Dominate ($149.99/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Duration (days)</Label>
              <Select value={newDuration} onValueChange={setNewDuration}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days (Trial)</SelectItem>
                  <SelectItem value="30">30 days (1 month)</SelectItem>
                  <SelectItem value="90">90 days (3 months)</SelectItem>
                  <SelectItem value="180">180 days (6 months)</SelectItem>
                  <SelectItem value="365">365 days (1 year)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-300">
                ⚠️ This will manually assign a subscription without payment. 
                Use this for special cases like partnerships or testing.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveSubscription} className="bg-purple-500 hover:bg-purple-600">
              Assign Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent className="bg-slate-900 border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="text-white font-semibold">{selectedUser?.email}</span>?
              <br /><br />
              This action will permanently remove the user and all associated data including:
              <ul className="list-disc list-inside mt-2 text-slate-400">
                <li>User profile and account</li>
                <li>Assigned roles and permissions</li>
                <li>Subscription data</li>
              </ul>
              <br />
              <span className="text-red-400 font-semibold">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="bg-slate-900 border-orange-500/20">
          <DialogHeader>
            <DialogTitle className="text-orange-400 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account manually
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email <span className="text-red-400">*</span></Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Initial Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                ℹ️ The user will be created without a password. They will need to use 
                Clerk authentication (Google, email link, etc.) to access their account.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
              Cancel
            </Button>
            <Button onClick={addUser} className="bg-green-600 hover:bg-green-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
