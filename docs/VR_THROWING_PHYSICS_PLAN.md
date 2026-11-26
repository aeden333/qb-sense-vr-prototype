# QB Sense VR — Full Throwing Physics Training System Plan

## Product vision

Build QB Sense VR into an immersive quarterback training system where players stand in a virtual pocket, scan the field with natural head movement, read coverage and pressure, and physically throw a football using controller or hand-tracking input.

The system should train decision-making, timing, accuracy, pressure response, and throw quality—not just clicking the correct receiver.

## Current foundation

The existing QB Sense web app already provides a strong football-training foundation:

- Game Situations with 13 passing concepts, formations, coverage, pressure, and scoring
- Two-Minute Drill using the same concepts, formations, and RB alignments
- Red Zone, Blitz Sim, and Progression drills
- Playbook creation with routes, RB assignments, and saved plays
- Progress tracking, rep review, analytics, and training plans
- A 3D Pocket Pressure prototype with mobile controls

These systems can remain the football brain of the product while VR becomes the immersive interface.

## Recommended platform

Use Meta Quest with Unity as the primary VR platform.

Unity is recommended because it provides native Quest support, a mature physics engine, controller and hand-tracking input, spatial audio, haptics, replay tools, and a clear path to a standalone Quest application.

The existing web application can remain the coach dashboard, playbook editor, account system, and progress center. The Unity VR app can consume play data through an API or exported JSON.

## Core VR experience

The player stands as the quarterback in a virtual pocket.

- The field is rendered in first person at quarterback eye level
- The offensive line, receivers, running back, and defenders are visible
- The player scans the field by turning their head
- Receivers run their assigned routes in real time
- Defenders match coverage and rush from realistic angles
- Pressure closes according to the existing drill timing
- The player throws by making a throwing motion and releasing a controller trigger or opening their hand

## Throwing input

Start with controller-based throwing.

The player grips the football with the trigger, makes a throwing motion, and releases the trigger to throw. The system tracks controller position and rotation during the final portion of the motion to calculate release velocity, direction, angle, and timing.

After controller throwing feels reliable, add hand tracking. Hand tracking can provide a more natural release, but controller input should remain available because it is more consistent and comfortable.

## Football physics

The football should be simulated as a physical object.

Core physics inputs:

- Release position
- Initial velocity
- Direction and launch angle
- Spin
- Gravity
- Air drag
- Optional wind
- Collision with defenders and receivers

The basic projectile model is:

p(t) = p0 + v0 * t + 0.5 * a * t^2

Where p0 is release position, v0 is initial velocity, a includes gravity and drag, and t is time since release.

The system does not need a full biomechanical arm simulation for the first version. Controller motion can determine the general throw direction and power, while a small coaching assist corrects minor aim errors.

## Throw grading

Grade every rep using both the football decision and the physical throw.

Decision metrics:

- Correct first open read
- Decision time
- Pressure response
- Sacks taken
- Interceptions
- Throwaways

Throw metrics:

- Intended receiver
- Actual landing point
- Accuracy
- Velocity
- Release timing
- Ball arc
- Lead or target placement
- On-time arrival

Possible outcomes:

- Completion
- Lead completion
- Underthrown pass
- Overthrown pass
- Late throw
- Deflection
- Interception
- Throwaway
- Sack

## Integration with existing systems

Reuse the existing football logic wherever possible.

- Game Situations supplies concepts, formations, routes, coverage, pressure, and scoring
- The Playbook supplies saved plays, receiver routes, and RB alignments
- Progress systems store rep results and player development
- Rep review can show a 3D replay after each throw
- Coaches can assign drills and review performance remotely

The Unity VR app should receive play data in a consistent JSON format:

- Concept
- Formation
- Receiver positions
- Route points
- RB alignment and route
- Coverage
- Pressure timing
- Blitz count
- Scenario rules

## Development phases

### Phase 1: VR pocket prototype

Build a first-person quarterback standing behind center.

- Simple low-poly field, players, and football
- Controller-based throwing
- Head tracking
- Game Situations automatic plays
- Basic coverage and pressure
- Completion, interception, sack, and throwaway outcomes

### Phase 2: Immersive pressure

Make pressure feel real.

- Defenders close from realistic angles
- Spatial audio for rushers, play calls, and crowd noise
- Haptic feedback when pressure closes
- Limited pocket movement with the joystick
- Adjustable difficulty and pressure timing

### Phase 3: Playbook in VR

Bring the Playbook into VR.

- Coach tablet or floating whiteboard interface
- Place receivers and draw routes in 3D
- Save plays to the existing team playbook
- Run saved plays immediately in the VR pocket
- Review plays from a bird's-eye replay

### Phase 4: Coaching and progression

Connect VR sessions to the existing progress system.

- Post-drive report in VR
- Decision time, accuracy, pressure response, and throw-quality metrics
- Coach dashboard and remote rep review
- Adaptive difficulty
- Personalized training plans

### Phase 5: Advanced biomechanics

Add deeper throwing analysis after the core experience is proven.

- Detailed arm, elbow, and wrist tracking
- Release-point consistency
- Throwing-motion analysis
- Velocity and spin modeling
- Personalized mechanical feedback

## Key risks

| Risk | Why it matters | Solution |
|---|---|---|
| Motion discomfort | Fast movement can cause nausea | Keep the QB mostly stationary and use a small movement zone |
| Input inconsistency | Hand tracking can be inconsistent | Start with controller motion and trigger release |
| Readability | Small targets are hard to see in VR | Use large route numbers, high-contrast markers, and spatial audio |
| Performance | VR requires stable frame rate | Use low-poly assets and optimize early |
| Overly difficult physics | Perfect real-world mechanics can frustrate users | Use physics with a coaching assist |
| Football realism | Defensive behavior must feel believable | Reuse existing coverage rules before adding complex animation |

## MVP definition

A strong first VR version includes:

- Meta Quest standalone app
- First-person quarterback view
- Controller-based throwing with physics
- Game Situations concepts, coverage, and pressure
- Receiver catch zones
- Interception and deflection logic
- Rep results and progression saving
- Post-rep feedback

## 30-day plan

- Create Unity Quest project
- Build first-person field and quarterback rig
- Implement controller-held football and release
- Add basic projectile physics
- Import one Game Situations concept
- Add one coverage and basic pressure
- Test comfort and frame rate

## 60-day plan

- Add all 13 Game Situations concepts
- Add formations and RB alignments
- Implement coverage matching and open-receiver logic
- Add receiver catch zones
- Add deflections and interceptions
- Add post-rep feedback
- Connect progress results

## 90-day plan

- Add Playbook integration
- Add saved-play execution
- Add 3D replay
- Add coach dashboard connection
- Add adaptive difficulty
- Run internal QB testing
- Prepare a public beta

## Success metrics

- Players can complete a full drive without discomfort
- Throws feel responsive and understandable
- Players improve decision time and pressure response over repeated sessions
- Coaches can identify whether a player made the right read and delivered an accurate, on-time throw
- Saved Playbook plays run correctly in VR

## Immediate next step

Build a Unity Quest prototype with one Game Situations concept, controller throwing, basic physics, one coverage, and pressure. Validate comfort, throwing feel, and decision-making before expanding the system.