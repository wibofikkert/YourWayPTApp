import db, { initDB } from './database.js'

initDB()

const EXERCISES = [
  // CHEST
  { name: 'Barbell Bench Press', muscle_group: 'Chest', secondary_muscles: 'Triceps,Front Deltoid', equipment: 'Barbell,Bench', instructions: 'Lie flat on bench. Grip bar slightly wider than shoulder-width. Lower bar to mid-chest under control. Press back up to full arm extension. Keep feet flat on floor and back naturally arched.' },
  { name: 'Incline Barbell Press', muscle_group: 'Chest', secondary_muscles: 'Triceps,Front Deltoid', equipment: 'Barbell,Incline Bench', instructions: 'Set bench to 30-45 degrees. Grip bar slightly wider than shoulder-width. Lower bar to upper chest. Press upward and slightly back. Targets upper chest.' },
  { name: 'Decline Barbell Press', muscle_group: 'Chest', secondary_muscles: 'Triceps', equipment: 'Barbell,Decline Bench', instructions: 'Set bench to -15 to -30 degrees. Feet secured under pads. Lower bar to lower chest. Press straight up. Emphasizes lower chest fibers.' },
  { name: 'Dumbbell Bench Press', muscle_group: 'Chest', secondary_muscles: 'Triceps,Front Deltoid', equipment: 'Dumbbells,Bench', instructions: 'Hold dumbbells at chest level, palms forward. Press up until arms extended, slight inward arc. Lower slowly. Greater range of motion than barbell.' },
  { name: 'Incline Dumbbell Press', muscle_group: 'Chest', secondary_muscles: 'Triceps,Front Deltoid', equipment: 'Dumbbells,Incline Bench', instructions: 'Set bench to 30-45 degrees. Press dumbbells from shoulder height to arms extended above upper chest. Great upper chest builder.' },
  { name: 'Dumbbell Flyes', muscle_group: 'Chest', secondary_muscles: 'Front Deltoid', equipment: 'Dumbbells,Bench', instructions: 'Lie on bench with dumbbells above chest, slight elbow bend. Open arms in wide arc until stretch felt in chest. Reverse the arc to return. Maintain soft elbow throughout.' },
  { name: 'Cable Crossover', muscle_group: 'Chest', secondary_muscles: 'Front Deltoid', equipment: 'Cable Machine', instructions: 'Stand between high cable pulleys. Pull cables down and across body in sweeping arc. Squeeze pecs at bottom. Control the return. Excellent for chest isolation.' },
  { name: 'Push-Up', muscle_group: 'Chest', secondary_muscles: 'Triceps,Core,Front Deltoid', equipment: 'Bodyweight', instructions: 'Start in high plank, hands slightly wider than shoulders. Lower chest to floor keeping body straight. Push back up. Can be modified (knees) or progressed (elevated feet).' },
  { name: 'Dips (Chest Version)', muscle_group: 'Chest', secondary_muscles: 'Triceps,Front Deltoid', equipment: 'Dip Bars', instructions: 'Grip parallel bars, lean torso forward 30 degrees. Lower body until upper arms are parallel to floor. Push back up. Forward lean shifts emphasis to chest over triceps.' },
  { name: 'Pec Deck Machine', muscle_group: 'Chest', secondary_muscles: 'Front Deltoid', equipment: 'Machine', instructions: 'Sit with arms at 90-degree angle against pads. Bring arms together in front of chest. Hold squeeze 1 second. Release slowly. Excellent isolation exercise.' },

  // BACK
  { name: 'Barbell Deadlift', muscle_group: 'Back', secondary_muscles: 'Glutes,Hamstrings,Core,Traps', equipment: 'Barbell', instructions: 'Stand with bar over mid-foot. Hinge at hips, grip just outside legs. Brace core, drive through floor. Keep bar close to body. Lock out hips and knees simultaneously. Lower with control.' },
  { name: 'Pull-Up', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'Pull-Up Bar', instructions: 'Hang from bar with overhand grip, shoulder-width or wider. Pull body up until chin clears bar. Lower fully. Keep elbows pointed down and outward.' },
  { name: 'Chin-Up', muscle_group: 'Back', secondary_muscles: 'Biceps', equipment: 'Pull-Up Bar', instructions: 'Hang from bar with underhand (supinated) grip at shoulder-width. Pull until chin above bar. Underhand grip increases bicep involvement compared to pull-up.' },
  { name: 'Barbell Bent-Over Row', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid,Core', equipment: 'Barbell', instructions: 'Hinge forward to roughly 45 degrees, back flat. Pull bar to lower ribcage. Squeeze shoulder blades together at top. Lower with control.' },
  { name: 'Seated Cable Row', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'Cable Machine', instructions: 'Sit with slight forward lean. Pull handle to lower ribcage. Drive elbows back and squeeze shoulder blades. Return slowly. Keep lower back stable.' },
  { name: 'Lat Pulldown', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'Cable Machine', instructions: 'Grip bar wider than shoulder-width. Pull bar to upper chest while leaning slightly back. Elbows drive down and back. Control the return.' },
  { name: 'T-Bar Row', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'T-Bar Machine', instructions: 'Straddle bar, hinge forward. Pull bar to chest. Squeeze back at top. Allows heavier loads than dumbbell row.' },
  { name: 'Single-Arm Dumbbell Row', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'Dumbbell,Bench', instructions: 'Place one knee and hand on bench. Row dumbbell to hip, elbow close to body. Lower fully. Allows great range of motion.' },
  { name: 'Face Pull', muscle_group: 'Back', secondary_muscles: 'Rear Deltoid,Traps,Rotator Cuff', equipment: 'Cable Machine,Rope', instructions: 'Set cable at eye height with rope attachment. Pull rope to forehead, elbows flared high. External rotate at end. Essential for shoulder health.' },
  { name: 'Romanian Deadlift', muscle_group: 'Back', secondary_muscles: 'Hamstrings,Glutes', equipment: 'Barbell', instructions: 'Start standing, push hips back while lowering bar along legs. Keep back flat and slight knee bend. Lower until hamstring stretch. Drive hips forward to return.' },

  // SHOULDERS
  { name: 'Overhead Press (Barbell)', muscle_group: 'Shoulders', secondary_muscles: 'Triceps,Traps,Core', equipment: 'Barbell', instructions: 'Stand with barbell at collar bone, grip just outside shoulders. Press directly overhead to full arm extension. Lower to clavicle. Maintain tight core throughout.' },
  { name: 'Dumbbell Shoulder Press', muscle_group: 'Shoulders', secondary_muscles: 'Triceps,Traps', equipment: 'Dumbbells', instructions: 'Sit or stand holding dumbbells at ear height, palms forward. Press overhead until arms extended. Lower to start.' },
  { name: 'Lateral Raise', muscle_group: 'Shoulders', secondary_muscles: 'Traps', equipment: 'Dumbbells', instructions: 'Stand with dumbbells at sides, slight elbow bend. Raise arms to shoulder height, palms down. Lower slowly over 2-3 seconds.' },
  { name: 'Front Raise', muscle_group: 'Shoulders', secondary_muscles: 'Chest', equipment: 'Dumbbells,Barbell', instructions: 'Hold weight in front of thighs. Raise arms straight to shoulder height. Lower slowly. Targets anterior deltoid.' },
  { name: 'Arnold Press', muscle_group: 'Shoulders', secondary_muscles: 'Triceps,Traps', equipment: 'Dumbbells', instructions: 'Start with dumbbells at chin height, palms facing you. As you press up, rotate palms outward. Finish with palms forward at top. Reverse on way down.' },
  { name: 'Rear Delt Fly', muscle_group: 'Shoulders', secondary_muscles: 'Traps', equipment: 'Dumbbells,Cable', instructions: 'Bend forward 45-90 degrees. Raise arms out to sides in reverse fly motion. Pinch shoulder blades at top. Targets posterior deltoid.' },
  { name: 'Upright Row', muscle_group: 'Shoulders', secondary_muscles: 'Traps,Biceps', equipment: 'Barbell,Dumbbells', instructions: 'Hold bar with overhand narrow grip. Pull bar straight up to chin level, elbows high and wide. Lower slowly.' },
  { name: 'Cable Lateral Raise', muscle_group: 'Shoulders', secondary_muscles: 'Traps', equipment: 'Cable Machine', instructions: 'Stand beside cable set at lowest position. Grab cable. Raise arm to side to shoulder height. Constant tension is the advantage over dumbbells.' },

  // LEGS
  { name: 'Barbell Back Squat', muscle_group: 'Legs', secondary_muscles: 'Glutes,Lower Back,Core', equipment: 'Barbell,Squat Rack', instructions: 'Bar on upper traps, feet shoulder-width with toes slightly out. Sit back and down keeping chest tall. Break parallel if mobility allows. Drive through heels to return.' },
  { name: 'Front Squat', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Barbell,Squat Rack', instructions: 'Bar resting on front deltoids, elbows high. Sit down keeping torso upright. More quad-dominant and core-demanding than back squat.' },
  { name: 'Leg Press', muscle_group: 'Legs', secondary_muscles: 'Glutes', equipment: 'Machine', instructions: 'Sit in machine with feet shoulder-width on platform. Lower weight until 90-degree knee angle. Press back to near lockout.' },
  { name: 'Bulgarian Split Squat', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Dumbbells,Bench', instructions: 'Rear foot elevated on bench, front foot ahead. Lower back knee toward floor. Front shin stays relatively vertical. Excellent for quad development.' },
  { name: 'Leg Curl (Lying)', muscle_group: 'Legs', secondary_muscles: 'Calves', equipment: 'Machine', instructions: 'Lie face down, pad just above ankles. Curl heels toward glutes. Pause at top. Lower slowly. Isolates hamstrings effectively.' },
  { name: 'Leg Extension', muscle_group: 'Legs', secondary_muscles: '', equipment: 'Machine', instructions: 'Sit with pad just above feet. Extend legs to full lockout. Pause to squeeze quad. Lower slowly over 3 seconds. Pure quad isolation.' },
  { name: 'Hack Squat', muscle_group: 'Legs', secondary_muscles: 'Glutes', equipment: 'Machine', instructions: 'Stand on platform with back against pad, feet shoulder-width. Lower until thighs parallel or below. Press back up.' },
  { name: 'Standing Calf Raise', muscle_group: 'Legs', secondary_muscles: '', equipment: 'Machine,Smith Machine', instructions: 'Stand on edge with balls of feet, heels hanging. Lower heels below platform. Rise as high as possible on toes. Hold 1 second at top.' },
  { name: 'Seated Calf Raise', muscle_group: 'Legs', secondary_muscles: '', equipment: 'Machine', instructions: 'Sit with pads on lower thighs, balls of feet on platform. Raise and lower heels. Targets soleus due to bent knee position.' },
  { name: 'Walking Lunge', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Bodyweight,Dumbbells', instructions: 'Step forward into lunge, lower back knee toward floor. Drive front foot to step forward into next lunge. Alternate legs.' },
  { name: 'Goblet Squat', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Dumbbell,Kettlebell', instructions: 'Hold weight at chest with both hands. Squat down keeping chest tall and elbows inside knees. Excellent teaching tool for squat mechanics.' },
  { name: 'Sumo Squat', muscle_group: 'Legs', secondary_muscles: 'Glutes,Adductors', equipment: 'Barbell,Dumbbell,Kettlebell', instructions: 'Wide stance with toes pointed out. Squat down keeping chest tall. More adductor and glute activation than standard squat.' },
  { name: 'Step-Up', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Box,Dumbbells', instructions: 'Step onto a box with one foot, drive up to standing. Step down and alternate. Great for unilateral leg strength and balance.' },

  // BICEPS
  { name: 'Barbell Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'Barbell', instructions: 'Stand with barbell at thighs, underhand grip. Curl to shoulder height keeping elbows at sides. Squeeze at top. Lower fully.' },
  { name: 'Dumbbell Alternating Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'Dumbbells', instructions: 'Stand or sit with dumbbells at sides. Curl one arm supinating wrist as you lift. Lower and alternate. Supination maximally activates biceps.' },
  { name: 'Hammer Curl', muscle_group: 'Biceps', secondary_muscles: 'Brachialis,Forearms', equipment: 'Dumbbells', instructions: 'Hold dumbbells with neutral grip (palms facing in). Curl to shoulder height without rotating wrist. Targets brachialis and brachioradialis.' },
  { name: 'Preacher Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'EZ Bar,Preacher Bench', instructions: 'Rest upper arm on preacher bench pad. Curl bar to chin. Lower fully — full extension stretch is key. Eliminates body swing.' },
  { name: 'Incline Dumbbell Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'Dumbbells,Incline Bench', instructions: 'Lie back on incline bench with arms hanging straight. Curl dumbbells. The incline creates greater stretch at bottom.' },
  { name: 'Cable Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'Cable Machine', instructions: 'Stand facing low cable, underhand grip on bar or rope. Curl to chin. Cable provides constant tension throughout the range of motion.' },
  { name: 'Concentration Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'Dumbbell', instructions: 'Sit on bench, elbow resting on inner thigh. Curl dumbbell to shoulder. Excellent isolation exercise, reduces ability to cheat with body swing.' },

  // TRICEPS
  { name: 'Close-Grip Bench Press', muscle_group: 'Triceps', secondary_muscles: 'Chest,Front Deltoid', equipment: 'Barbell,Bench', instructions: 'Same as bench press but hands 6-8 inches apart. Lower bar to lower chest/sternum. Elbows stay closer to body. Compounds tricep strength.' },
  { name: 'Tricep Pushdown', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Cable Machine', instructions: 'Stand at high cable, overhand grip on bar or rope. Push down to full arm extension. Keep elbows at sides. Control return.' },
  { name: 'Overhead Tricep Extension', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Dumbbell,EZ Bar,Cable', instructions: 'Hold weight overhead with arms extended. Lower behind head by bending at elbows. Press back to full extension. Overhead position provides maximum stretch.' },
  { name: 'Skull Crusher', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'EZ Bar,Barbell,Bench', instructions: 'Lie on bench, EZ bar above chest. Lower bar toward forehead by bending elbows. Press back up. Keep upper arms perpendicular to floor throughout.' },
  { name: 'Dips (Triceps Version)', muscle_group: 'Triceps', secondary_muscles: 'Chest,Front Deltoid', equipment: 'Dip Bars', instructions: 'Grip parallel bars, keep torso upright (vertical). Lower until upper arms parallel to floor. Press back up. Upright torso shifts emphasis to triceps.' },
  { name: 'Diamond Push-Up', muscle_group: 'Triceps', secondary_muscles: 'Chest', equipment: 'Bodyweight', instructions: 'Place hands close together forming a diamond shape. Perform push-up keeping elbows tight to body. More tricep-focused than standard push-up.' },
  { name: 'Tricep Kickback', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Dumbbell', instructions: 'Hinge forward, upper arm parallel to floor. Extend forearm back to straight. Lower with control. Best with lighter weight and strict form.' },

  // CORE
  { name: 'Plank', muscle_group: 'Core', secondary_muscles: 'Shoulders,Glutes', equipment: 'Bodyweight', instructions: 'Forearms on floor, body in straight line from head to feet. Squeeze glutes and abs. Hold for time.' },
  { name: 'Cable Crunch', muscle_group: 'Core', secondary_muscles: '', equipment: 'Cable Machine,Rope', instructions: 'Kneel facing cable, rope held at either side of head. Contract abs to crunch down toward floor. Do not pull with arms — movement must come from abs.' },
  { name: 'Hanging Leg Raise', muscle_group: 'Core', secondary_muscles: 'Hip Flexors', equipment: 'Pull-Up Bar', instructions: 'Hang from bar with arms extended. Raise legs until parallel to floor or higher. Lower slowly. Demands grip and core strength.' },
  { name: 'Ab Rollout', muscle_group: 'Core', secondary_muscles: 'Shoulders,Lats', equipment: 'Ab Wheel,Barbell', instructions: 'Kneel holding ab wheel at knees. Roll forward extending body toward floor. Roll back using core — do NOT let hips sag.' },
  { name: 'Russian Twist', muscle_group: 'Core', secondary_muscles: 'Obliques', equipment: 'Bodyweight,Weight Plate', instructions: 'Sit with knees bent, lean back 45 degrees. Rotate torso side to side touching weight to floor. Targets obliques strongly.' },
  { name: 'Pallof Press', muscle_group: 'Core', secondary_muscles: 'Shoulders', equipment: 'Cable Machine,Band', instructions: 'Stand sideways to cable. Hold handle at chest. Press straight out, resist rotation. Hold 2 seconds. Return. Anti-rotation core exercise.' },
  { name: 'Dead Bug', muscle_group: 'Core', secondary_muscles: 'Hip Flexors', equipment: 'Bodyweight', instructions: 'Lie on back, arms straight up, hips and knees at 90 degrees. Lower opposite arm and leg toward floor. Return and alternate. Keep lower back pressed to floor.' },
  { name: 'Side Plank', muscle_group: 'Core', secondary_muscles: 'Obliques,Glutes', equipment: 'Bodyweight', instructions: 'Lie on side, forearm under shoulder. Lift hips forming straight line. Hold for time. Targets obliques and lateral stability. Can be progressed with hip dips.' },

  // GLUTES
  { name: 'Hip Thrust', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Core', equipment: 'Barbell,Bench', instructions: 'Sit with upper back on bench, barbell over hip crease. Plant feet hip-width. Drive hips up until body forms straight line from knees to shoulders. Squeeze glutes hard at top.' },
  { name: 'Glute Bridge', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Core', equipment: 'Bodyweight,Barbell', instructions: 'Lie on back, knees bent, feet flat. Drive hips toward ceiling squeezing glutes. Hold 1-2 seconds at top. Return. Excellent warm-up or beginner glute builder.' },
  { name: 'Cable Kickback', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings', equipment: 'Cable Machine,Ankle Strap', instructions: 'Attach ankle strap. Face cable, hold support. Kick leg back and slightly up. Squeeze glute at top. Return slowly.' },
  { name: 'Sumo Deadlift', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Adductors,Back', equipment: 'Barbell', instructions: 'Wide stance with toes pointed out, hands inside legs. Lower hips more than conventional deadlift. Drive hips through to lock out. More glute and adductor involvement.' },
  { name: 'Single-Leg Glute Bridge', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Core', equipment: 'Bodyweight', instructions: 'Lie on back, one knee bent, other leg extended. Drive hips up using one leg. Higher demand on glute and hamstring of working leg.' },

  // FULL BODY
  { name: 'Barbell Clean', muscle_group: 'Full Body', secondary_muscles: 'Traps,Core,Legs,Shoulders', equipment: 'Barbell', instructions: 'Start over mid-foot. First pull: bar to knees. Second pull: explosive triple extension of ankles, knees, hips. Drop under bar catching on front delts. Technical Olympic lift.' },
  { name: "Farmer's Walk", muscle_group: 'Full Body', secondary_muscles: 'Core,Traps,Grip,Legs', equipment: 'Dumbbells,Trap Bar,Kettlebells', instructions: 'Pick up heavy implements with neutral grip. Walk upright for distance or time. Builds grip, traps, core stability, and conditioning simultaneously.' },
  { name: 'Kettlebell Swing', muscle_group: 'Full Body', secondary_muscles: 'Glutes,Hamstrings,Core,Shoulders', equipment: 'Kettlebell', instructions: 'Hinge at hips with kettlebell between legs. Drive hips explosively forward projecting bell to shoulder height. Hinge back absorbing force. Hip hinge is the key movement pattern.' },
  { name: 'Box Jump', muscle_group: 'Full Body', secondary_muscles: 'Calves,Core', equipment: 'Plyometric Box', instructions: 'Stand in front of box. Dip into quarter squat, swing arms, jump onto box landing softly with bent knees. Step down. Builds explosive power.' },
  { name: 'Battle Ropes', muscle_group: 'Full Body', secondary_muscles: 'Shoulders,Core,Arms', equipment: 'Battle Ropes', instructions: 'Hold one rope in each hand. Perform alternating or simultaneous waves. Keep hips low and core braced. Excellent conditioning tool. Typically done in 30-60 second intervals.' },
  { name: 'Thruster', muscle_group: 'Full Body', secondary_muscles: 'Shoulders,Core,Triceps', equipment: 'Barbell,Dumbbells,Kettlebells', instructions: 'Hold weight at shoulder height. Squat down, then as you rise drive the weight overhead in one continuous movement. A front squat into a push press.' },
  { name: 'Power Clean', muscle_group: 'Full Body', secondary_muscles: 'Traps,Core,Legs', equipment: 'Barbell', instructions: 'Similar to clean but caught in a partial squat rather than full squat. Explosive pulling movement targeting posterior chain and power development.' }
]

const existing = db.prepare('SELECT COUNT(*) as count FROM exercises WHERE is_custom = 0').get()
if (existing.count > 0) {
  console.log(`Database already has ${existing.count} exercises. Skipping seed.`)
  console.log('Delete ptapp.db to re-seed.')
  process.exit(0)
}

const insert = db.prepare(`
  INSERT INTO exercises (name, muscle_group, secondary_muscles, equipment, instructions, is_custom, trainer_id)
  VALUES (?, ?, ?, ?, ?, 0, NULL)
`)

const insertMany = db.transaction((exercises) => {
  for (const ex of exercises) {
    insert.run(ex.name, ex.muscle_group, ex.secondary_muscles || null, ex.equipment || null, ex.instructions || null)
  }
})

insertMany(EXERCISES)
console.log(`Seeded ${EXERCISES.length} exercises successfully.`)
