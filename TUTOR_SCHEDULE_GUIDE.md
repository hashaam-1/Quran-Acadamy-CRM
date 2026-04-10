# 🗓️ Tutor Schedule - Time Grid View

## ✅ What's Been Created

I've created a new **Tutor Schedule** page that displays schedules in a time-grid format, exactly like the image you provided!

### Features:

1. **Time-based Grid Layout**
   - ✅ Hourly time slots on the left (12 AM - 11 PM)
   - ✅ Days of the week across the top
   - ✅ Colored blocks for scheduled classes

2. **Visual Design**
   - ✅ Color-coded courses (Qaida=Blue, Nazra=Red, Hifz=Yellow, Tajweed=Green)
   - ✅ Free slots shown with light gray background
   - ✅ Today's column highlighted
   - ✅ Class count badges on each day

3. **Interactive Features**
   - ✅ Search by student/teacher name
   - ✅ Filter by teacher
   - ✅ Week navigation (previous/next/today)
   - ✅ Hover effects on time slots
   - ✅ Tooltip showing full class details

4. **Smart Scheduling**
   - ✅ Classes positioned at correct time slots
   - ✅ Multi-hour classes span multiple rows
   - ✅ Empty slots clearly visible

---

## 📍 How to Access

### URL:
```
http://localhost:8080/tutor-schedule
```

Or navigate from the sidebar menu (you may need to add a menu item).

---

## 🎨 Color Scheme

The schedule uses color-coding for different courses:

| Course | Color | Hex Code |
|--------|-------|----------|
| Qaida | Blue | `bg-blue-500` |
| Nazra | Red | `bg-red-500` |
| Hifz | Yellow | `bg-yellow-500` |
| Tajweed | Green | `bg-green-500` |

Free slots: Light gray (`bg-gray-50`)

---

## 🔧 How It Works

### Time Slot Calculation:
1. Parses class time (e.g., "9:00 AM") to 24-hour format
2. Calculates duration (e.g., "60 min" = 1 hour)
3. Places colored block at correct time slot
4. Spans multiple rows for longer classes

### Example:
- Class at **9:00 AM** for **60 min**
  - Starts at 9 AM row
  - Spans 1 hour (1 row)
  - Shows student name, teacher, and time

---

## 📱 Responsive Design

- Desktop: Full grid view with all days visible
- Tablet: Horizontal scroll for full week
- Mobile: Optimized for smaller screens

---

## 🎯 Usage Tips

### For Admins:
1. Select a teacher from dropdown to view their schedule
2. Use search to find specific students
3. Navigate weeks to plan ahead
4. Empty slots show where new classes can be scheduled

### For Teachers:
1. View your weekly schedule at a glance
2. See all classes color-coded by course type
3. Identify free time slots
4. Plan your teaching hours

### For Students:
1. See your class schedule
2. Know exact times for each class
3. View teacher assignments

---

## 🚀 Next Steps

### To Add to Navigation Menu:

1. Open `Frontend/src/components/layout/Sidebar.tsx`
2. Add menu item:
```tsx
{
  title: "Tutor Schedule",
  icon: Calendar,
  href: "/tutor-schedule",
  roles: ["admin", "teacher", "team_leader"]
}
```

### To Customize Colors:

Edit `Frontend/src/pages/TutorSchedule.tsx`:
```tsx
const courseColors: Record<string, string> = {
  Qaida: "bg-blue-500",    // Change to your preferred color
  Nazra: "bg-red-500",
  Hifz: "bg-yellow-500",
  Tajweed: "bg-green-500",
};
```

### To Adjust Time Range:

Modify the `generateTimeSlots()` function:
```tsx
// Show only 6 AM to 10 PM
for (let hour = 6; hour < 22; hour++) {
  // ... time slot generation
}
```

---

## 📊 Features Comparison

| Feature | Old Schedule | New Tutor Schedule |
|---------|-------------|-------------------|
| View Type | Card-based | Time-grid |
| Time Display | Inside cards | Left sidebar |
| Empty Slots | Hidden | Visible (gray) |
| Multi-hour Classes | Single card | Spans rows |
| Visual Density | Low | High |
| At-a-glance View | Limited | Excellent |

---

## 🐛 Troubleshooting

### Classes Not Showing:
- Check that schedule has `time` field (e.g., "9:00 AM")
- Verify `duration` field (e.g., "60 min")
- Ensure `day` matches weekday names

### Wrong Time Slot:
- Time format must be: "HH:MM AM/PM"
- Examples: "9:00 AM", "2:30 PM", "12:00 PM"

### Colors Not Showing:
- Course name must match exactly: "Qaida", "Nazra", "Hifz", "Tajweed"
- Case-sensitive

---

## 📝 Technical Details

### File Location:
```
Frontend/src/pages/TutorSchedule.tsx
```

### Dependencies:
- Uses existing `useSchedules` hook
- Uses existing `useTeachers` hook
- Reuses UI components from shadcn/ui

### Key Functions:
- `generateTimeSlots()` - Creates 24-hour time array
- `parseTimeToHour()` - Converts "9:00 AM" to 9
- `parseDuration()` - Converts "60 min" to 1 hour
- `getSchedulesForSlot()` - Finds classes for specific time/day

---

## ✅ What's Different from Image

Your image shows:
- ✅ Time slots on left - **IMPLEMENTED**
- ✅ Days across top - **IMPLEMENTED**
- ✅ Colored class blocks - **IMPLEMENTED**
- ✅ Gray free slots - **IMPLEMENTED**
- ✅ Class count badges - **IMPLEMENTED**
- ✅ Search functionality - **IMPLEMENTED**
- ✅ Teacher filter - **IMPLEMENTED**

---

## 🎉 Summary

You now have a professional time-grid schedule view that:
- Shows hourly time slots (12 AM - 11 PM)
- Displays days of the week across the top
- Color-codes classes by course type
- Shows free slots in gray
- Allows filtering and searching
- Matches the design in your image!

**Access it at:** `/tutor-schedule`

Enjoy your new schedule view! 🚀
