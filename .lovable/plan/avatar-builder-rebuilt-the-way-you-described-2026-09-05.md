# Avatar builder, rebuilt the way you described

The last version drew flat cartoon icons. That's gone. The new builder uses real
picture tiles rendered in the same glossy 3D style as your two reference portraits,
and the avatar on the frame updates the moment you tap something.

## How it works for the user

1. Tap **Male** or **Female** — a finished glossy 3D avatar appears on the frame immediately.
2. Scroll through the option rows. Every option is a picture, not a word.
3. Tap any option → it is applied to the avatar within a second.

## The option catalogue

| Row | Count |
| --- | --- |
| Skin shade | 15 |
| Face shape | 10 |
| Nose | 10 |
| Eyes | 10 |
| Mouth | 5 male / 10 female |
| Eyebrows | 15 |
| Hair colour | 20 incl. highlights/streaks |
| Hairstyle | 20 male / 30 female |
| Make-up | 12 (both genders) |
| Accessories | 30+ — earrings, necklaces, sunglasses, headbands, scarves, hijabs, hats, caps, AirPods Max, cultural pieces |
| Outfits | 20 styles x 12 colours |

## Where the tile pictures come from

Each row gets a pre-rendered **sprite sheet**: one image containing all that row's
variants, drawn on a neutral 3D head in the reference style (like the face-shape grid
you sent, but skin-toned). The app slices the sheet so each tile is a real picture.
Sheets are generated once, stored on the CDN, and cost nothing at runtime.

Rows where the change is pure colour (skin, hair colour, outfit colour, eye colour)
show true colour chips rather than a head photo — clearer and instant.

## The avatar on the frame

Your selections are turned into a description and rendered as the glossy 3D portrait
by the same image engine already wired into the app, keeping your face consistent
between edits so only the thing you changed changes. A live stylised preview shows
instantly while the full render finishes.

## Build order

1. Generate and upload the sprite sheets (faces, noses, eyes, mouths, brows,
   hairstyles M/F, accessories, outfits, make-up).
2. New catalogue file mapping every option name to its sheet cell + prompt wording.
3. Rewrite the studio screen: gender → instant avatar → picture rows, no wizard steps.
4. Keep the selfie start, the save-to-profile flow and the rate limits as they are.

## Note

This is a large amount of generated artwork. I will build it in one pass and show you
the result; if a specific sheet looks off, I can regenerate that single row without
touching the rest.
