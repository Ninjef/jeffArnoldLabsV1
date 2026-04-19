# Overview

I've got more animation ideas, and I'd like you to implement them. I want different animations to be unique; to minimize the same ol' same ol'. But I'd also like to take the existin animation at site/src/components/animations/LightbulbIdea.tsx and make it more generic - you should be able to pass any icon into it, and any color, and have the icon flash and the text flash that color. No longer should this be a "LightBulbIdea" animation, but a more general "EmojiTextFlashAnimation" thing.

In addition, I want the following kinds of animations:
- An animation where text 1, text 2, and text 3 are tied together (or only text 1 and 2, or texts 1, 2, 3, 4 - but doesn't need to be indefinite - just up to 4 is fine, heck even just 3 for now), but may be separated by text which does not animate. When the scroll window hits the first bit of text, text 1 glows a defined color first, then text 2 glows a different color, then text 3 a different... etc...
- An animation where an emoji is chosen, and the emoji is stretched and blurred across the given text (so, I could have a train emoji stretch and blur across and beyond a "GO FAST!" set of text)
- An animation where some an emoji expands outwards from the given text block and disappears slowly or quickly depending on how it's configured
