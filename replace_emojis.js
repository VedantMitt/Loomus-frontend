const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Loomus-frontend', 'app', 'activities', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports
const importStatement = `import { 
  Sparkles, ClipboardList, Flame, Palette, Globe, MapPin, 
  Clock, Calendar, Moon, Edit3, Mail, Trash2, LogOut,
  Target, Flag, Gamepad2, Music, Coffee, Film, Luggage, Car, Building2,
  Tv, BookOpen, Utensils, Dumbbell, Mic, Plus
} from "lucide-react";`;

if (!content.includes('"lucide-react"')) {
    content = content.replace(
        'import HobbyAnimatedBg from "@/components/HobbyAnimatedBg";',
        'import HobbyAnimatedBg from "@/components/HobbyAnimatedBg";\n' + importStatement
    );
}

// 2. Update Categories
const categoriesReplacements = {
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
};

for (const [emoji, icon] of Object.entries(categoriesReplacements)) {
    content = content.replace(`emoji: ${emoji}`, `icon: ${icon}`);
}

// 3. Replace the rendering of category icon
content = content.replace(
    '<div className="exp-card-emoji">{cat.emoji}</div>',
    '<div className="exp-card-emoji text-white/90 flex items-center justify-center w-full h-full"><cat.icon size={42} strokeWidth={1.5} /></div>'
);

// 4. Replace other emojis
content = content.replace('✨ Start a Loom', '<><Sparkles className="w-4 h-4 inline mr-2" /> Start a Loom</>');
content = content.replace('📋 My Looms', '<><ClipboardList className="w-4 h-4 inline mr-2" /> My Looms</>');
content = content.replace('<span className="glow-icon">🔥</span> Top Upcoming Events', '<><Flame className="w-5 h-5 inline mr-2 text-orange-500" /> Top Upcoming Events</>');
content = content.replace('📍 Nearby', '<><MapPin className="w-3 h-3 inline mr-1" /> Nearby</>');
// Replace all '📍 {event.location}' and '📍 {plan.location}' with regex
content = content.replace(/📍 {event\.location}/g, '<><MapPin className="w-4 h-4 inline mr-1" /> {event.location}</>');
content = content.replace(/📍 {plan\.location}/g, '<><MapPin className="w-4 h-4 inline mr-1" /> {plan.location}</>');
content = content.replace(/⏰ {event\.time}/g, '<><Clock className="w-4 h-4 inline mr-1" /> {event.time}</>');

content = content.replace(
    '<div><span className="glow-icon">🎨</span> Hobbies based meetups</div>',
    '<div className="flex items-center"><Palette className="w-5 h-5 inline mr-2 text-pink-400" /> Hobbies based meetups</div>'
);

content = content.replace('<span>✨</span> Pick your vibe', '<><Sparkles className="w-5 h-5 inline mr-2 text-yellow-400" /> Pick your vibe</>');
content = content.replace('<span>🌍</span> Hop into random plans', '<><Globe className="w-5 h-5 inline mr-2 text-blue-400" /> Hop into random plans</>');

content = content.replace(
    '<div className="exp-empty-emoji">🌙</div>',
    '<div className="flex justify-center mb-4 text-gray-500"><Moon size={48} /></div>'
);
content = content.replace('✨ Create a Plan', '<><Sparkles className="w-4 h-4 inline mr-2" /> Create a Plan</>');
content = content.replace('🌍', '<Globe className="w-4 h-4 inline ml-1" />');

content = content.replace('📝 Edit Details', '<><Edit3 className="w-4 h-4 mr-2" /> Edit Details</>');
content = content.replace('✉️ Invite', '<><Mail className="w-4 h-4 mr-2" /> Invite</>');
content = content.replace('🗑️ Delete Plan', '<><Trash2 className="w-4 h-4 mr-2" /> Delete Plan</>');
content = content.replace('🚪 View & Leave', '<><LogOut className="w-4 h-4 mr-2" /> View & Leave</>');

content = content.replace(/📅 {d\.toLocaleDateString/g, '<Calendar className="w-4 h-4 inline mr-1" /> {d.toLocaleDateString');
content = content.replace(/🕐 {d\.toLocaleTimeString/g, '<Clock className="w-4 h-4 inline mr-1" /> {d.toLocaleTimeString');

content = content.replace("'>+</button>", "'><Plus size={16} strokeWidth={3} /></button>");
content = content.replace(/⏰ \{\(event as any\)/g, '<><Clock className="w-4 h-4 inline mr-1" /> {(event as any)');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Done");
