# Clerk Role-Based Access Control Setup Guide

## ✅ What's Been Implemented

The system now has **role-based access control** with two user roles:

### **Admin Role**

- Full dashboard access
- All menu items: Overview, Live Monitoring, Alerts & Logs, Settings
- Dark sidebar with "Admin Dashboard" label

### **Community Role**

- Limited access (community-friendly)
- Only menu items: Overview, Live Monitoring
- Green-themed sidebar with "Community Monitor" label
- Cannot access Alerts & Logs or Settings (auto-redirected to home)

---

## 🔧 How to Set User Roles in Clerk

### **Step 1: Access Clerk Dashboard**

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Click on **"Users"** in the left sidebar

### **Step 2: Set Admin Role**

1. Find your user account in the list
2. Click on the user to open details
3. Scroll down to **"Public metadata"** section
4. Click **"Edit"**
5. Add the following JSON:

```json
{
  "role": "admin"
}
```

6. Click **"Save"**

### **Step 3: Regular Community Users**

For community users, you have two options:

- **Option 1:** Leave metadata empty (defaults to "community")
- **Option 2:** Explicitly set:

```json
{
  "role": "community"
}
```

---

## 🧪 Testing the Setup

### **Test as Admin:**

1. Sign in with the account you set as admin
2. You should see all 4 menu items in the sidebar
3. Try accessing `/alerts-logs` and `/settings` - should work

### **Test as Community:**

1. Create a new Clerk account (or use existing non-admin account)
2. Sign in
3. You should see only 2 menu items: Overview and Live Monitoring
4. Try accessing `/alerts-logs` - should redirect to home page

---

## 📁 Files Created/Modified

### **New Files:**

- `lib/clerk-roles.ts` - Role utility functions
- `components/RoleGuard.tsx` - Client-side route protection
- `components/admin/AdminSidebar.tsx` - Admin sidebar (all features)
- `components/community/CommunitySidebar.tsx` - Community sidebar (limited)

### **Modified Files:**

- `app/page.tsx` - Now uses role-based sidebar
- `app/live-monitoring/page.tsx` - Shows appropriate sidebar
- `app/alerts-logs/page.tsx` - Admin-only access
- `app/settings/page.tsx` - Admin-only access
- `components/AppLayout.tsx` - Accepts sidebar as prop

---

## 🎯 How It Works

1. **User logs in** via Clerk
2. **Role is fetched** from `user.publicMetadata.role`
3. **If role is "admin":**
   - Shows AdminSidebar (4 menu items)
   - Can access all routes
4. **If role is "community" or undefined:**
   - Shows CommunitySidebar (2 menu items)
   - Redirected if trying to access admin routes

---

## 🚀 Next Steps (Optional)

### **Add More Roles:**

Edit `lib/clerk-roles.ts` to add roles like:

- `moderator` - Community leaders with extra permissions
- `viewer` - Read-only access
- `emergency_responder` - Special access during alerts

### **Automatic Role Assignment:**

Create a Clerk webhook to auto-assign "community" role when users sign up.

### **Role Management UI:**

Build an admin page where admins can change user roles without going to Clerk Dashboard.

---

## 🐛 Troubleshooting

**Problem:** User still sees old sidebar after setting role  
**Solution:** Sign out completely and sign back in (Clerk caches metadata)

**Problem:** Getting redirected to home even as admin  
**Solution:** Check Clerk Dashboard - make sure metadata is exactly `{"role": "admin"}` with quotes

**Problem:** TypeScript errors  
**Solution:** Run `npm install` to ensure all dependencies are installed

---

## 📞 Support

If you encounter issues, check:

1. Clerk Dashboard → Users → Your User → Public Metadata
2. Browser console for any error messages
3. Network tab to see if Clerk is returning user data

---

**Setup Complete! 🎉**

Your Slope Sentry now has role-based access control ready for admin and community users!
