# Nesh Portfolio CMS - Setup Guide

## ✅ What's Been Built

- **Admin Login** at `/admin/login`
- **Admin Dashboard** at `/admin/dashboard` (add/edit/delete portfolio pieces)
- **Image Upload** to Supabase Storage
- **Database Integration** with 25 starter pieces
- **Public Gallery Pages** that pull from the database

---

## 🚀 Step-by-Step Setup

### **1. Set Up the Database in Supabase**

1. Go to [supabase.co](https://supabase.co) and open your project
2. Click **SQL Editor** → **New Query**
3. Paste the SQL below and run it:

```sql
-- Create portfolio_pieces table
create table if not exists portfolio_pieces (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null check (category in ('film', 'stills')),
  vimeo_url text,
  image_url text,
  storage_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table portfolio_pieces enable row level security;

-- Create RLS policies (allow public read)
create policy "Enable read access for all users" on portfolio_pieces
  for select using (true);

-- Create storage bucket for portfolio images
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
on conflict do nothing;

-- Set up storage policy for public read
create policy "Public Access" on storage.objects
  for select using (bucket_id = 'portfolio');

-- Create index on category for faster queries
create index if not exists idx_portfolio_category on portfolio_pieces(category);
```

### **2. Seed the Database with 25 Starter Pieces**

Once the table is created, run:

```bash
npm run seed
```

This populates the database with 25 starter portfolio pieces across film and stills categories.

### **3. Update Admin Credentials (Optional)**

In `.env.local`, change the default credentials:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
```

### **4. Start the Dev Server**

```bash
npm run dev
```

### **5. Access the Admin Dashboard**

- **Login Page**: http://localhost:3000/admin/login
- **Username**: `admin`
- **Password**: `changeme123` (or what you set)

---

## 🎨 Admin Dashboard Features

- **View all portfolio pieces** organized by category
- **Add new pieces** with:
  - Title
  - Description
  - Category (Film or Stills)
  - Vimeo URL (optional, for films)
  - Image URL (paste external URL)
  - Image Upload (upload directly to Supabase Storage)
- **Edit existing pieces** - click Edit on any card
- **Delete pieces** - click Delete on any card
- **Logout** - top right button

---

## 📸 Gallery Pages

The public gallery pages automatically pull from the database:

- `/work/directing` - Film category
- `/work/photography` - Stills category
- `/work/videography` - Film category  
- `/work/production` - Stills category

These will display your database pieces instead of placeholders once seeded.

---

## 🖼️ Image Upload Options

### **Option 1: Upload to Supabase Storage**
1. In the admin dashboard, click "Upload Image"
2. Select a file from your computer
3. It uploads automatically when you save

### **Option 2: Use External URLs**
1. Paste a Bunny CDN URL (or any image URL) in the "Image URL" field
2. This overrides any uploaded file

### **Option 3: Both**
- Upload files to Supabase for backups
- Use external URLs from Bunny CDN for CDN delivery

---

## 🔐 Security Notes

- Admin credentials are stored in `.env.local` (local dev)
- For production in Vercel, add `ADMIN_USERNAME` and `ADMIN_PASSWORD` to environment variables
- Supabase RLS policies allow public read-only access
- Writes are only accepted via the admin API endpoints

---

## 📱 Deployment to Vercel

1. **Push to Git**:
```bash
git add .
git commit -m "Add portfolio CMS"
git push
```

2. **Add Environment Variables in Vercel**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`

3. **Deploy** - Vercel will auto-deploy on push

---

## ✅ Checklist

- [ ] Run SQL setup in Supabase
- [ ] Run `npm run seed` to populate data
- [ ] Update `.env.local` with secure credentials
- [ ] Test login at `/admin/login`
- [ ] Add/edit/delete a portfolio piece
- [ ] Verify it appears on `/work/directing` or other gallery pages
- [ ] Push to production

---

## 🆘 Troubleshooting

**Can't login?**
- Check `.env.local` has correct credentials
- Make sure `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set

**Images not showing?**
- Verify image URLs are valid
- Check Supabase Storage bucket is public
- Ensure "Public Access" policy is enabled

**Database queries failing?**
- Confirm SQL was run successfully in Supabase
- Check Supabase URL and Anon Key in `.env.local`
- Verify CORS is enabled (if needed)

---

## 📝 Next Steps

1. Replace the default passwords with something secure
2. Update the 25 starter pieces with your actual work
3. Upload your portfolio images to Supabase Storage
4. Customize the category mappings if needed

---

**You're all set!** 🎉

The CMS is ready to manage your portfolio. Start adding your real work through the admin dashboard.
