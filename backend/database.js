import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// In production use DATABASE_PATH env var (Railway persistent volume), else local file
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'ptapp.db')
const db = new Database(dbPath)

export function initDB() {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS trainers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      trainer_id  INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL,
      email       TEXT,
      birth_date  TEXT,
      notes       TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT    NOT NULL,
      muscle_group      TEXT    NOT NULL,
      secondary_muscles TEXT,
      equipment         TEXT,
      instructions      TEXT,
      is_custom         INTEGER NOT NULL DEFAULT 0,
      trainer_id        INTEGER REFERENCES trainers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      trainer_id  INTEGER NOT NULL REFERENCES trainers(id),
      date        TEXT    NOT NULL,
      notes       TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      set_number  INTEGER NOT NULL,
      reps        INTEGER NOT NULL,
      weight_kg   REAL    NOT NULL,
      rpe         INTEGER CHECK(rpe BETWEEN 1 AND 10)
    );

    CREATE TABLE IF NOT EXISTS client_schedule (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      UNIQUE(client_id, day_of_week)
    );

    CREATE INDEX IF NOT EXISTS idx_clients_trainer  ON clients(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_client  ON workout_sessions(client_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_trainer ON workout_sessions(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_sets_session     ON workout_sets(session_id);
    CREATE INDEX IF NOT EXISTS idx_sets_exercise    ON workout_sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle_group);
    CREATE INDEX IF NOT EXISTS idx_schedule_client  ON client_schedule(client_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_day     ON client_schedule(day_of_week);
  `)

  // Migrations: safely add columns to existing databases
  const cols = db.prepare("PRAGMA table_info(trainers)").all().map(c => c.name)
  if (!cols.includes('is_admin')) {
    db.exec("ALTER TABLE trainers ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
  }
  if (!cols.includes('is_active')) {
    db.exec("ALTER TABLE trainers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")
  }

  // Migration: add duo_partner_id to clients
  const clientCols = db.prepare("PRAGMA table_info(clients)").all().map(c => c.name)
  if (!clientCols.includes('duo_partner_id')) {
    db.exec("ALTER TABLE clients ADD COLUMN duo_partner_id INTEGER REFERENCES clients(id)")
  }

  // Migration: add start_time to client_schedule
  const scheduleCols = db.prepare("PRAGMA table_info(client_schedule)").all().map(c => c.name)
  if (!scheduleCols.includes('start_time')) {
    db.exec("ALTER TABLE client_schedule ADD COLUMN start_time TEXT")
  }

  // Ensure the designated admin account is always admin
  const ADMIN_EMAIL = 'wibo.fikkert@gmail.com'
  db.prepare("UPDATE trainers SET is_admin = 1 WHERE email = ?").run(ADMIN_EMAIL)

  // Migration: add gym-specific exercises (INSERT OR IGNORE keeps existing data safe)
  const NEW_EXERCISES = [
    // CHEST
    { name: 'Landmine Press', muscle_group: 'Chest', secondary_muscles: 'Front Deltoid,Triceps', equipment: 'Barbell,Landmine', instructions: 'Load one end of barbell in landmine attachment. Press bar up and slightly forward from chest height using one or both hands. More shoulder-friendly angle than flat press.' },
    { name: 'Single-Arm Landmine Press', muscle_group: 'Chest', secondary_muscles: 'Front Deltoid,Triceps,Core', equipment: 'Barbell,Landmine', instructions: 'Kneel or stand. Hold end of landmine bar with one hand at shoulder height. Press diagonally upward to full arm extension. Demands unilateral core stability.' },
    { name: 'Dumbbell Squeeze Press', muscle_group: 'Chest', secondary_muscles: 'Triceps', equipment: 'Dumbbells,Bench', instructions: 'Lie on bench holding dumbbells pressed together above chest, palms facing each other. Lower both together keeping constant squeeze between them. Press back up. High pec activation.' },
    { name: 'Band Push-Up', muscle_group: 'Chest', secondary_muscles: 'Triceps,Core,Front Deltoid', equipment: 'Elastieken', instructions: 'Loop resistance band across upper back, hold ends under palms. Perform push-ups with added band resistance. Band increases load at lockout, rewarding full extension.' },
    { name: 'Incline Dumbbell Flyes', muscle_group: 'Chest', secondary_muscles: 'Front Deltoid', equipment: 'Dumbbells,Bench', instructions: 'Set bench to 30-45 degrees. Hold dumbbells above upper chest with slight elbow bend. Open arms in wide arc feeling a stretch across upper chest. Reverse the arc to return.' },
    // BACK
    { name: 'Landmine Row', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'Barbell,Landmine', instructions: 'Stand over barbell in landmine attachment, hinge forward. Row bar to hip in single-arm or both hands. Allows natural wrist rotation for a comfortable rowing position.' },
    { name: 'Meadows Row', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'Barbell,Landmine', instructions: 'Stand perpendicular to landmine, stagger feet. With outside hand grab end of bar. Row aggressively toward hip, lead with elbow. Excellent for lat thickness.' },
    { name: 'Lat Pulldown (V-handle)', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'Pulley,V-handle', instructions: 'Attach V-handle to overhead pulley. Pull down toward upper chest with a neutral grip. Elbows drive down and back. Neutral grip often allows heavier load and less shoulder stress.' },
    { name: 'Straight-Arm Pulldown', muscle_group: 'Back', secondary_muscles: 'Core,Triceps', equipment: 'Pulley,Straight Bar', instructions: 'Stand facing overhead pulley with straight bar. Keep arms nearly straight throughout. Pull bar from eye level down to thighs in an arc. Isolates lat without bicep involvement.' },
    { name: 'Rope Pullover', muscle_group: 'Back', secondary_muscles: 'Core,Triceps', equipment: 'Pulley,Rope', instructions: 'Kneel facing overhead pulley with rope attachment. With arms extended, pull rope from overhead to hips in an arc. Keep elbows soft. Excellent lat stretch and contraction.' },
    { name: 'Seated Row (D-handle)', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid', equipment: 'Pulley,D-handles', instructions: 'Attach D-handles to low pulley. Sit with slight forward lean. Row both handles to lower ribcage with neutral grip. Drive elbows back, squeeze shoulder blades together. Return slowly.' },
    { name: 'Single-Arm Cable Row', muscle_group: 'Back', secondary_muscles: 'Biceps,Rear Deltoid,Core', equipment: 'Pulley,D-handles', instructions: 'Attach D-handle to low pulley. Sit or stand facing cable. Row single arm to hip driving elbow back. Anti-rotation demand increases core challenge.' },
    { name: 'Band Pull-Apart', muscle_group: 'Back', secondary_muscles: 'Rear Deltoid,Rotator Cuff', equipment: 'Elastieken', instructions: 'Hold resistance band at shoulder width with straight arms in front. Pull band apart until it touches your chest, squeezing shoulder blades together. Control return. Excellent shoulder health exercise.' },
    { name: 'RowErg (Rowing Machine)', muscle_group: 'Back', secondary_muscles: 'Legs,Core,Biceps,Glutes', equipment: 'RowErg', instructions: 'Set erg damper to 4-6. Drive with legs first, then lean back, then pull handle to lower sternum in one fluid sequence. Return by extending arms, leaning forward, then bending knees. Powerful conditioning tool.' },
    { name: 'Good Morning', muscle_group: 'Back', secondary_muscles: 'Hamstrings,Glutes', equipment: 'Barbell', instructions: 'Bar on upper traps. Hinge at hips with slight knee bend, lowering torso toward horizontal. Keep back flat throughout. Drive hips through to return. Excellent posterior chain builder.' },
    // SHOULDERS
    { name: 'Landmine Press (Shoulder)', muscle_group: 'Shoulders', secondary_muscles: 'Triceps,Upper Chest', equipment: 'Barbell,Landmine', instructions: 'Hold end of landmine bar at shoulder height with one hand. Press diagonally upward to full arm extension. Arc of motion is more shoulder-friendly than strict overhead press.' },
    { name: 'Cable Face Pull (Rope)', muscle_group: 'Shoulders', secondary_muscles: 'Rear Deltoid,Traps,Rotator Cuff', equipment: 'Pulley,Rope', instructions: 'Set pulley at face height with rope attachment. Pull rope to forehead, elbows flared high and wide. Externally rotate at end. Non-negotiable for shoulder health.' },
    { name: 'Cable Lateral Raise (D-handle)', muscle_group: 'Shoulders', secondary_muscles: 'Traps', equipment: 'Pulley,D-handles', instructions: 'Stand sideways to low pulley. Grab D-handle with far hand. Raise arm to shoulder height in a lateral arc. Cable provides constant tension unlike dumbbells.' },
    { name: 'Dumbbell Lateral Raise (seated)', muscle_group: 'Shoulders', secondary_muscles: 'Traps', equipment: 'Dumbbells,Bench', instructions: 'Sit on end of bench, dumbbells at sides. Raise arms to shoulder height keeping slight elbow bend. Seated version reduces body swing for stricter isolation.' },
    { name: 'Band Lateral Raise', muscle_group: 'Shoulders', secondary_muscles: 'Traps', equipment: 'Elastieken', instructions: 'Stand on resistance band holding ends. Raise arms to the side to shoulder height. Bands load progressively through range of motion. Good for high-rep shoulder work.' },
    { name: 'Plate Front Raise', muscle_group: 'Shoulders', secondary_muscles: 'Chest', equipment: 'Plates', instructions: "Hold weight plate at 3 and 9 o'clock. Raise straight out in front to shoulder height. Lower slowly. The disc grip challenges forearms and wrists additionally." },
    { name: 'Kettlebell Press', muscle_group: 'Shoulders', secondary_muscles: 'Triceps,Core', equipment: 'Kettlebell', instructions: 'Clean kettlebell to rack position (resting on forearm, bell behind hand). Press overhead to full extension. Lower with control. The offset weight demands greater stability.' },
    // LEGS
    { name: 'Barbell Pause Squat', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Barbell,Squat Rack', instructions: 'Perform back squat but pause 2-3 seconds at parallel before driving up. Eliminates stretch reflex, building pure strength out of the hole. Excellent for technique.' },
    { name: 'Landmine Squat', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Barbell,Landmine', instructions: 'Hold end of landmine bar at chest with both hands. Squat down, keeping torso upright due to the diagonal load. Easier on lower back than barbell back squat.' },
    { name: 'Dumbbell Romanian Deadlift', muscle_group: 'Legs', secondary_muscles: 'Glutes,Lower Back', equipment: 'Dumbbells', instructions: 'Stand holding dumbbells in front of thighs. Push hips back lowering dumbbells along legs until hamstring stretch is felt. Drive hips through to return. Keep back flat throughout.' },
    { name: 'Kettlebell Romanian Deadlift', muscle_group: 'Legs', secondary_muscles: 'Glutes,Lower Back', equipment: 'Kettlebell', instructions: 'Hold kettlebell(s) in front. Push hips back lowering weight toward floor, keeping back flat. Drive hips forward to return. Kettlebell position often allows more natural movement.' },
    { name: 'Single-Leg Romanian Deadlift', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Dumbbell,Kettlebell', instructions: 'Stand on one leg holding weight. Hinge at hip extending free leg behind for counterbalance. Lower weight toward floor, keep back flat. Return to upright. Demands balance and hip stability.' },
    { name: 'Barbell Hip Thrust', muscle_group: 'Legs', secondary_muscles: 'Hamstrings,Core', equipment: 'Barbell,Bench', instructions: 'Upper back on bench, barbell over hip crease. Feet hip-width flat on floor. Drive hips upward until fully extended. Squeeze glutes hard at top.' },
    { name: 'Box Step-Up (Weighted)', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Box,Dumbbells,Barbell', instructions: 'Hold dumbbells or barbell. Place one foot on box, drive up to standing. Lower under control. Trains unilateral leg strength and hip extension. Drive through the heel of the elevated foot.' },
    { name: 'Cossack Squat', muscle_group: 'Legs', secondary_muscles: 'Adductors,Core', equipment: 'Bodyweight,Dumbbell,Kettlebell', instructions: 'Wide stance. Shift weight to one side lowering into a deep lateral lunge. Other leg remains straight with heel on floor. Return to centre. Develops hip mobility and adductor strength.' },
    { name: 'Nordic Hamstring Curl', muscle_group: 'Legs', secondary_muscles: 'Calves,Glutes', equipment: 'Bench', instructions: 'Kneel with feet anchored (under bench or held). Slowly lower body toward floor resisting with hamstrings. Push up with hands. One of the most effective hamstring exercises for injury prevention.' },
    { name: 'Standing Hip Abduction (Band)', muscle_group: 'Legs', secondary_muscles: 'Glutes', equipment: 'Crab-Walk Elastieken', instructions: 'Place band around ankles. Stand with slight knee bend. Raise one leg out to the side against band resistance. Control the return. Targets gluteus medius.' },
    { name: 'Crab Walk', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Crab-Walk Elastieken', instructions: 'Place band around ankles or just above knees. Assume quarter squat position. Step sideways maintaining tension in band and consistent squat depth. Switch directions. Activates glute medius.' },
    { name: 'Lateral Band Walk (Above Knees)', muscle_group: 'Legs', secondary_muscles: 'Glutes', equipment: 'Crab-Walk Elastieken', instructions: 'Band just above knees. Stand with feet hip-width, slight squat. Step sideways with control, maintaining band tension. Keep feet parallel, do not let knees cave in.' },
    { name: 'Sissy Squat', muscle_group: 'Legs', secondary_muscles: '', equipment: 'Bodyweight', instructions: 'Stand holding light support. Rise onto toes and lean body back while bending knees, lowering body toward floor with shins angled back. Return by driving hips forward. Extreme quad isolation.' },
    { name: 'Wall Sit', muscle_group: 'Legs', secondary_muscles: '', equipment: 'Bodyweight', instructions: 'Back flat against wall. Lower into seated position at 90-degree knee angle. Hold for time. Isometric quad strength builder. Can add dumbbells on thighs to increase difficulty.' },
    { name: 'Landmine Romanian Deadlift', muscle_group: 'Legs', secondary_muscles: 'Glutes,Lower Back', equipment: 'Barbell,Landmine', instructions: 'Hold end of landmine bar with one or both hands. Hinge at hips lowering the bar as your hips go back. Keep back flat. Drive hips forward to return. The angled load is easy on the lower back.' },
    { name: 'Step-Up to Reverse Lunge', muscle_group: 'Legs', secondary_muscles: 'Glutes,Core', equipment: 'Box,Dumbbells', instructions: 'Step onto box, drive to standing. Step back off into a reverse lunge before switching. Combines step-up strength with lunge hip control in one fluid movement.' },
    { name: 'SkiErg', muscle_group: 'Legs', secondary_muscles: 'Core,Shoulders,Back', equipment: 'SkiErg', instructions: 'Stand facing SkiErg. Pull handles down simultaneously in a powerful skiing motion driving hips back and knees slightly bent. Stand back up as handles return. Can also be done alternating. Excellent conditioning.' },
    // BICEPS
    { name: 'EZ-Bar Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'EZ-Bar', instructions: 'Hold EZ-bar with underhand grip on angled portion. Curl to shoulder height keeping elbows at sides. The angled grip reduces wrist strain compared to straight barbell.' },
    { name: 'EZ-Bar Preacher Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'EZ-Bar,Bench', instructions: 'Rest upper arms on incline bench pad. Curl EZ-bar from full extension to peak contraction. Eliminates body swing for strict isolation. Full extension at bottom is essential.' },
    { name: 'Cable Curl (Rope)', muscle_group: 'Biceps', secondary_muscles: 'Forearms,Brachialis', equipment: 'Pulley,Rope', instructions: 'Attach rope to low pulley. Curl rope to chin allowing wrists to supinate at the top. Rope allows natural wrist rotation increasing peak contraction.' },
    { name: 'Pulley Curl (D-handle)', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'Pulley,D-handles', instructions: 'Attach D-handle to low pulley. Curl single arm to shoulder height, elbow stays stationary. Constant cable tension throughout range of motion.' },
    { name: 'Kettlebell Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms,Brachialis', equipment: 'Kettlebell', instructions: 'Hold kettlebell with hand through handle, bell hanging below. Curl to shoulder height. The offset weight challenges grip and forearm stability throughout the movement.' },
    { name: 'Band Curl', muscle_group: 'Biceps', secondary_muscles: 'Forearms', equipment: 'Elastieken', instructions: 'Stand on resistance band. Curl ends up to shoulder height. Band loads most at peak contraction. Good for finishing sets or high-rep work.' },
    { name: 'Reverse Curl', muscle_group: 'Biceps', secondary_muscles: 'Brachialis,Forearms', equipment: 'Barbell,EZ-Bar,Dumbbells', instructions: 'Hold bar with overhand (pronated) grip. Curl to shoulder height. Reverse grip shifts emphasis to brachialis and brachioradialis for complete arm development.' },
    { name: 'Cross-Body Hammer Curl', muscle_group: 'Biceps', secondary_muscles: 'Brachialis,Forearms', equipment: 'Dumbbells', instructions: 'Perform hammer curl but curl dumbbell across body toward opposite shoulder instead of straight up. Emphasizes brachialis differently than standard hammer curl.' },
    // TRICEPS
    { name: 'Tricep Pushdown (Straight Bar)', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Pulley,Straight Bar', instructions: 'Stand at high pulley with straight bar attachment. Overhand grip at shoulder-width. Push bar down to thighs keeping elbows tucked at sides. Control the return.' },
    { name: 'Tricep Pushdown (Rope)', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Pulley,Rope', instructions: 'Stand at overhead pulley with rope attachment. Push rope down, spreading rope apart at the bottom to fully extend and isolate all three heads of the tricep. Return slowly.' },
    { name: 'Overhead Cable Tricep Extension', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Pulley,Rope', instructions: 'Face away from overhead pulley holding rope behind head. Extend arms forward and down. The overhead position maximally stretches the long head of the tricep. Control the return.' },
    { name: 'EZ-Bar Skull Crusher', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'EZ-Bar,Bench', instructions: 'Lie on bench, EZ-bar above chest, angled grip. Lower bar toward forehead bending at elbows. Press back to full extension. Easier on wrists than straight bar.' },
    { name: 'EZ-Bar Overhead Tricep Extension', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'EZ-Bar', instructions: 'Hold EZ-bar overhead with narrow angled grip. Lower behind head by bending elbows. Press back to full extension. Overhead position provides maximum stretch of long head.' },
    { name: 'Single-Arm Cable Kickback', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Pulley,D-handles', instructions: 'Attach D-handle to low pulley. Hinge forward, upper arm parallel to floor. Extend forearm back against cable resistance. Great isolation with constant tension.' },
    { name: 'Dumbbell Tate Press', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Dumbbells,Bench', instructions: 'Lie on bench with dumbbells above chest, elbows pointed out. Lower dumbbells by bending elbows outward until they touch chest. Press back up by extending elbows. Targets medial head of tricep.' },
    { name: 'Band Tricep Pushdown', muscle_group: 'Triceps', secondary_muscles: '', equipment: 'Elastieken', instructions: 'Anchor band at head height. Grip band and push down to full extension, keeping elbows at sides. Good for activation warm-up or high-rep finisher sets.' },
    { name: 'Landmine Tricep Extension', muscle_group: 'Triceps', secondary_muscles: 'Core', equipment: 'Barbell,Landmine', instructions: 'Kneel in front of landmine attachment. Hold end of bar overhead. Bend elbows lowering bar behind head. Press back to full extension. The angled load is wrist-friendly.' },
    // CORE
    { name: 'Landmine Rotation', muscle_group: 'Core', secondary_muscles: 'Shoulders,Obliques', equipment: 'Barbell,Landmine', instructions: 'Stand perpendicular to landmine. Clasp hands at end of bar with arms straight. Rotate the bar from one side to the other through a wide arc. Keep core braced throughout. Power from rotation, not arms.' },
    { name: 'Pallof Press (Band)', muscle_group: 'Core', secondary_muscles: 'Shoulders', equipment: 'Elastieken', instructions: 'Anchor band at chest height to a fixed point. Stand sideways, hold band at chest. Press straight out and hold 2 seconds. Return. Resist the rotational pull. Anti-rotation stability exercise.' },
    { name: 'Cable Woodchop (High to Low)', muscle_group: 'Core', secondary_muscles: 'Shoulders,Obliques', equipment: 'Pulley,D-handles', instructions: 'Set pulley high. Stand sideways, grip D-handle with both hands. Pull handle diagonally down and across body as if chopping wood. Rotate through thoracic spine. Control return.' },
    { name: 'Cable Woodchop (Low to High)', muscle_group: 'Core', secondary_muscles: 'Shoulders,Obliques', equipment: 'Pulley,D-handles', instructions: 'Set pulley low. Stand sideways, grip D-handle with both hands. Pull handle diagonally upward and across body. Rotate through thoracic spine. The reverse pattern of the high-to-low chop.' },
    { name: 'Hollow Hold', muscle_group: 'Core', secondary_muscles: 'Hip Flexors', equipment: 'Bodyweight', instructions: 'Lie on back. Raise legs to 45 degrees and shoulders off floor with arms reaching overhead. Lower back pressed into floor. Hold for time. Foundation of gymnastics core strength.' },
    { name: 'L-Sit (Bench)', muscle_group: 'Core', secondary_muscles: 'Hip Flexors,Triceps', equipment: 'Bench', instructions: 'Sit on edge of bench, hands beside hips. Press into bench lifting hips and extending legs straight out. Hold position. Demands tremendous core and hip flexor strength.' },
    { name: 'Suitcase Carry', muscle_group: 'Core', secondary_muscles: 'Traps,Grip,Obliques', equipment: 'Dumbbell,Kettlebell', instructions: 'Hold a single dumbbell or kettlebell at one side. Walk upright, resisting lateral lean. Forces core to work anti-laterally. Builds obliques and quadratus lumborum.' },
    { name: 'Hanging Knee Raise', muscle_group: 'Core', secondary_muscles: 'Hip Flexors', equipment: 'Pulley', instructions: 'Attach cuffs to overhead cable. Hang with cuffs on wrists or hold bar. Raise knees toward chest contracting abs. Lower slowly. Beginner progression before straight-leg raise.' },
    { name: 'Cable Crunch (Rope)', muscle_group: 'Core', secondary_muscles: '', equipment: 'Pulley,Rope', instructions: 'Kneel facing overhead pulley with rope attachment. Hold rope at sides of head. Contract abs crunching down toward floor — movement comes from abs, not arms. Hold 1 second at bottom.' },
    { name: 'Waterbag Carry', muscle_group: 'Core', secondary_muscles: 'Shoulders,Traps,Legs', equipment: 'Waterzak', instructions: 'Hug or hold waterbag at chest or overhead. Walk, lunge, or squat. The unpredictable shifting water forces constant core stabilisation in all planes. Functional strength builder.' },
    { name: 'Waterbag Slam', muscle_group: 'Core', secondary_muscles: 'Shoulders,Back,Legs', equipment: 'Waterzak', instructions: 'Hold waterbag overhead with both hands. Slam it down powerfully toward floor engaging the entire posterior and anterior chain. Pick up and repeat. Excellent power and conditioning exercise.' },
    { name: 'Plate Rotation', muscle_group: 'Core', secondary_muscles: 'Obliques,Shoulders', equipment: 'Plates', instructions: 'Stand holding a weight plate with both hands. Rotate the plate in a large horizontal circle in front of the body. Alternate direction each set. Challenges rotational core strength and shoulder stability.' },
    // GLUTES
    { name: 'Cable Kickback (Ankle Cuff)', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings', equipment: 'Pulley,Kickback Straps', instructions: 'Attach kickback strap to ankle. Face low pulley, hold support. Kick leg back and slightly up squeezing glute at top. Keep hips square. Return slowly. Excellent glute isolation.' },
    { name: 'Cable Pull-Through', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Lower Back', equipment: 'Pulley,Rope', instructions: 'Stand facing away from low pulley. Reach between legs grabbing rope. Hinge forward letting rope pull between legs. Drive hips through to stand, squeezing glutes. Hip hinge pattern similar to kettlebell swing.' },
    { name: 'Banded Hip Thrust', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Core', equipment: 'Elastieken,Bench', instructions: 'Set up for hip thrust with resistance band placed just above knees. Push knees out against band as you thrust hips up. Band increases glute medius activation alongside the main glute max.' },
    { name: 'Banded Glute Bridge', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Core', equipment: 'Elastieken', instructions: 'Lie on back with band just above knees. Drive knees apart against band as you bridge up. Adds lateral glute activation to standard bridge.' },
    { name: 'Landmine Romanian Deadlift (Glutes)', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Lower Back', equipment: 'Barbell,Landmine', instructions: 'Hold end of landmine bar with both hands. Push hips back lowering bar as you hinge. Feel stretch through glutes and hamstrings. Drive hips forward to return. Angled load is lower back friendly.' },
    { name: 'Kettlebell Deadlift', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings,Lower Back,Core', equipment: 'Kettlebell', instructions: 'Stand with kettlebell between feet. Hinge at hips keeping back flat, grip handle. Drive through floor to stand extending hips fully. Lower under control. Great deadlift teaching tool.' },
    { name: 'Monster Walk', muscle_group: 'Glutes', secondary_muscles: 'Legs', equipment: 'Crab-Walk Elastieken', instructions: 'Place band above or below knees. Take diagonal steps forward — step out and forward alternating sides in a monster-walk pattern. Keep tension in band throughout. Targets glute medius and hip abductors.' },
    { name: 'Donkey Kick (Cable)', muscle_group: 'Glutes', secondary_muscles: 'Hamstrings', equipment: 'Pulley,Kickback Straps', instructions: 'Attach kickback strap to ankle. On hands and knees or standing bent over. Drive knee forward then kick foot back and up. Keep hips square. Targets glute max through full extension.' },
    { name: 'Standing Abduction (Cable)', muscle_group: 'Glutes', secondary_muscles: '', equipment: 'Pulley,Cuffs', instructions: 'Attach cuff to ankle. Stand sideways to low pulley. Lift attached leg out to the side against cable resistance. Control return. Isolates gluteus medius.' },
    // FULL BODY
    { name: 'Kettlebell Turkish Get-Up', muscle_group: 'Full Body', secondary_muscles: 'Core,Shoulders,Glutes,Legs', equipment: 'Kettlebell', instructions: 'Lie holding kettlebell straight up with one arm. Roll to elbow, then hand, sweep leg through, lunge up to standing. Reverse to return. The gold standard of full-body stability and mobility.' },
    { name: 'Landmine Clean and Press', muscle_group: 'Full Body', secondary_muscles: 'Legs,Core,Shoulders,Back', equipment: 'Barbell,Landmine', instructions: 'Row end of landmine bar to shoulder in a clean motion. Immediately press overhead. Lower and repeat. Combines a pulling and pressing movement in one fluid sequence.' },
    { name: 'Kettlebell Clean and Press', muscle_group: 'Full Body', secondary_muscles: 'Core,Legs,Shoulders', equipment: 'Kettlebell', instructions: 'Clean kettlebell from swing to rack position at shoulder. Immediately press overhead. Lower back through rack to swing. Technical movement combining hip drive with overhead press.' },
    { name: 'Sandbag / Waterbag Complex', muscle_group: 'Full Body', secondary_muscles: 'Core,Shoulders,Legs,Back', equipment: 'Waterzak', instructions: 'Perform a series of movements with the waterbag: deadlift, clean to shoulder, squat, press, rotation. Flow between movements with minimal rest. Builds grip, conditioning, and total body strength.' },
    { name: 'SkiErg Sprint', muscle_group: 'Full Body', secondary_muscles: 'Core,Shoulders,Back,Legs', equipment: 'SkiErg', instructions: 'Pull SkiErg handles down explosively in powerful double-arm pull, hinging at hips and bending knees. Reset quickly and repeat at maximum effort. Used for short sprints (10-30 seconds) or longer conditioning intervals.' },
    { name: 'Waterbag Squat and Press', muscle_group: 'Full Body', secondary_muscles: 'Legs,Shoulders,Core', equipment: 'Waterzak', instructions: 'Hold waterbag at chest or shoulder. Squat down, then as you rise press the bag overhead. The shifting water creates instability demanding constant adjustment. Excellent functional strength exercise.' },
    { name: 'Dumbbell Complex', muscle_group: 'Full Body', secondary_muscles: 'Core,Legs,Shoulders,Back', equipment: 'Dumbbells', instructions: 'Perform a series of exercises back-to-back without putting dumbbells down: Romanian deadlift, hang clean, front squat, press. Each rep flows into the next. Builds strength and serious conditioning.' },
    { name: 'Barbell Complex', muscle_group: 'Full Body', secondary_muscles: 'Core,Legs,Shoulders,Back', equipment: 'Barbell', instructions: 'Perform 6 reps each without setting bar down: Romanian deadlift, bent-over row, hang power clean, front squat, press. Classic barbell complex for conditioning and strength endurance.' },
  ]

  const upsertExercise = db.prepare(`
    INSERT OR IGNORE INTO exercises (name, muscle_group, secondary_muscles, equipment, instructions, is_custom, trainer_id)
    VALUES (?, ?, ?, ?, ?, 0, NULL)
  `)
  const insertNewExercises = db.transaction((exercises) => {
    for (const ex of exercises) {
      upsertExercise.run(ex.name, ex.muscle_group, ex.secondary_muscles || null, ex.equipment || null, ex.instructions || null)
    }
  })
  insertNewExercises(NEW_EXERCISES)
}

export default db
