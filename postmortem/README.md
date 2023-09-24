# Post Mortem for Witch Cup 1276

**IN PROGRESS**

The theme "13th century" was announced, and somehow, in the first minutes, it was clear to me: I want to do a racing game, with witches! (inspired by some books like "Wyrd Sisters" from Terry Prattchett right next to my desk)

So where to start? As my pixel-skills are ~~not the best~~ miserable i decided to create the graphics using the drawing tools from canvas and some kind of random generators.
The second decision was, that it will be a 2.5d top-down view, like the old Amiga games often used (i.e. "Super Off Road")

## The first pixels: Trees

Witches live in tiny houses deep in the woods. So, the races should also take place in the forest. For my first sketches on paper i just used cirles on sticks to represent the trees. So i started to implement just that only using the cancas drawing functions arc() and lineTo().

This looked ok at first, and was fast enough to render many (hundred) trees in the gameloop. But it looked boring.

Next step: draw the greens with 3-5 ellipses. better, and still fast enough to render about 600 trees per frame. But still: that was not the look i had in mind.

So, as further refinement, i added "leaves" to the stack. Each of the ellipses now got overpainted with about 400 tiny ellipses, the brightness of the color got adjusted by its position inside of the bigger ellipse (top-left brighter, bottom right darker) to create some depth. So now each tree consists of some lines for the trunk, and about 1600 to 2000 leaves. 

![trees-concept](assets/trees_concept.jpg)

This resulted in a framerate of 60 fps (limited by getAnimationframe, i guess) for 150 trees on my gaming-pc (which i used at that state for development) and in about 0.2 frames per second (1 frame every 5 seconds) on my older (10 years) laptop. Oopsie. :-)
So what should i do now? I really liked the look of the trees, and that every tree i placed looked different.

![tree](assets/tree.jpg)

### Prerendering
The rescue: Prerendered images in offscreen-canvases, stored in an image-pool. 

I added 50 tree-images to the pool, end every time when i place a new tree, it fetches its image-index from the pool, returning to the first image, when the full count is reached. Upon rendering I just paint that image to the game-canvas. 

Now even my old laptop could render many hundred trees in 60fps. 

### Adding a subspecies: Pines

"Same, same! But different!"

To add a bit more diversity in my forest, i decided to create a second type of trees: conifers

![pines-concept](assets/pines_concept.jpg)

The process is mostly the same, only the regions for the leaves are now stacked and get smaller to the top.

![pine](assets/pine.jpg)

### Rocks

For the rocks i skipped the tree-trunk and tweaked the position-related color-correction a bit, but mostly its the same process as for the trees: just many little details with slighly random colors.

![pine](assets/rock.jpg)

## Witches

Some circles and lines

## Background graphics

Second canvas below

## Editor for Racetracks

More tracks, and editable tracks

## Music

Corvus Corax and Soundbox
