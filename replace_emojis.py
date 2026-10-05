import re

with open(r"c:\Loomus-frontend\app\activities\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
import_statement = """import { 
  Sparkles, ClipboardList, Flame, Palette, Globe, MapPin, 
  Clock, Calendar, Moon, Edit3, Mail, Trash2, LogOut,
  Target, Flag, Gamepad2, Music, Coffee, Film, Luggage, Car, Building2,
  Tv, BookOpen, Utensils, Dumbbell, Mic, Plus
} from "lucide-react";"""

if "lucide-react" not in content:
    content = content.replace('import HobbyAnimatedBg from "@/components/HobbyAnimatedBg";', 
        'import HobbyAnimatedBg from "@/components/HobbyAnimatedBg";\n' + import_statement)

# 2. Update Categories
categories_replacements = {
    '"🎳"': "Target",
    '"⛳"': "Flag",
    '"🏓"': "Gamepad2",
    '"🎶"': "Music",
    '"☕"': "Coffee",
    '"🎬"': "Film",
    '"🧳"': "Luggage",
    '"🚗"': "Car",
    '"🏙️"': "Building2",
    '"📍"': "MapPin",
    '"🎮"': "Gamepad2",
    '"📺"': "Tv",
    '"📖"': "BookOpen",
    '"🍜"': "Utensils",
    '"💪"': "Dumbbell",
    '"🎤"': "Mic"
}

for emoji, icon in categories_replacements.items():
    content = content.replace(f'emoji: {emoji}', f'icon: {icon}')

# 3. Replace the rendering of category icon
content = content.replace('<div className="exp-card-emoji">{cat.emoji}</div>', 
                          '<div className="exp-card-emoji text-white/90 flex items-center justify-center w-full h-full"><cat.icon size={42} strokeWidth={1.5} /></div>')

# 4. Replace other emojis
content = content.replace('✨ Start a Loom', '<><Sparkles className="w-4 h-4 inline mr-2" /> Start a Loom</>')
content = content.replace('📋 My Looms', '<><ClipboardList className="w-4 h-4 inline mr-2" /> My Looms</>')
content = content.replace('<span className="glow-icon">🔥</span> Top Upcoming Events', '<><Flame className="w-5 h-5 inline mr-2 text-orange-500" /> Top Upcoming Events</>')
content = content.replace('📍 Nearby', '<><MapPin className="w-3 h-3 inline mr-1" /> Nearby</>')
content = content.replace('📍 {event.location}', '<><MapPin className="w-4 h-4 inline mr-1" /> {event.location}</>')
content = content.replace('⏰ {event.time}', '<><Clock className="w-4 h-4 inline mr-1" /> {event.time}</>')

# Hobby section
content = content.replace('<div><span className="glow-icon">🎨</span> Hobbies based meetups</div>', 
                          '<div className="flex items-center"><Palette className="w-5 h-5 inline mr-2 text-pink-400" /> Hobbies based meetups</div>')

content = content.replace('<span>✨</span> Pick your vibe', 
                          '<><Sparkles className="w-5 h-5 inline mr-2 text-yellow-400" /> Pick your vibe</>')

content = content.replace('<span>🌍</span> Hop into random plans', 
                          '<><Globe className="w-5 h-5 inline mr-2 text-blue-400" /> Hop into random plans</>')

content = content.replace('📍 {plan.location}', '<><MapPin className="w-4 h-4 inline mr-1" /> {plan.location}</>')

# Empty state and actions
content = content.replace('<div className="exp-empty-emoji">🌙</div>', 
                          '<div className="flex justify-center mb-4 text-gray-500"><Moon size={48} /></div>')
content = content.replace('✨ Create a Plan', '<><Sparkles className="w-4 h-4 inline mr-2" /> Create a Plan</>')
content = content.replace('🌍', '<Globe className="w-4 h-4 inline ml-1" />')

content = content.replace('📝 Edit Details', '<><Edit3 className="w-4 h-4 mr-2" /> Edit Details</>')
content = content.replace('✉️ Invite', '<><Mail className="w-4 h-4 mr-2" /> Invite</>')
content = content.replace('🗑️ Delete Plan', '<><Trash2 className="w-4 h-4 mr-2" /> Delete Plan</>')
content = content.replace('🚪 View & Leave', '<><LogOut className="w-4 h-4 mr-2" /> View & Leave</>')

# Date / time emojis
content = content.replace('📅 {d.toLocaleDateString', '<Calendar className="w-4 h-4 inline mr-1" /> {d.toLocaleDateString')
content = content.replace('🕐 {d.toLocaleTimeString', '<Clock className="w-4 h-4 inline mr-1" /> {d.toLocaleTimeString')

# Fix hobbies + icon
content = content.replace("'>+</button>", "'><Plus size={16} strokeWidth={3} /></button>")

# Find ⏰ {(event as any).time or (new Date...)}
content = content.replace('⏰ {(event as any)', '<><Clock className="w-4 h-4 inline mr-1" /> {(event as any)')

with open(r"c:\Loomus-frontend\app\activities\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
