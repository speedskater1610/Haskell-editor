# Haskell Editor
## features
- Function definitions and recursion
- Basic arithmetic operations (+, -, *, /)
- putStrLn and show for output
- Pattern matching on numbers
- Where clauses for local functions
- Do notation for IO
- Made in react
## [Go here to use it](https://speedskater1610.github.io/Haskell-editor/)
## reason to build
My school handed us what might be the most underpowered Chromebooks known to human civilization. Being someone who likes to write code in basically every class instead of doing the work I’m actually supposed to be doing, I rely heavily on our school’s provided platform, CodeHS.

Don’t get me wrong CodeHS is great. Without it, I’d probably be sitting there staring at Google Docs pretending it’s a compiler. But it has… drawbacks. For one, their editor is not vi, vim, or neovim (btw) (I need my sweet h,j,k,l).
Also: please, I am begging you, let us make header/source files in C/C++ that actually talk to each other. Let people use makefiles. Unleash the chaos.

But the real tragedy?
Their language selection is thinner than my patience.
No Rust.
No Haskell.
No React projects.
(My 3am brain has more languages it wants but forget remembering those.)

So I needed a way to write and run Haskell code on a school ChromeOS device, without installing anything, without backend servers, and without incurring the wrath of the school's firewall. A browser-only web application was perfect.

And since my favorite thing to build is compilers/interpreters, I descended into the darkest depths imaginable:
JavaScript.
(Wanted to use TypeScript. Really did. My dark side said “no types, only pain,” and apparently I listened.)

*Shoutout to CodeHS devs, especially the Arch users (btw). Their backend for C/C++ is literally running the binaries you upload on an Arch server (btw). Respect.*
