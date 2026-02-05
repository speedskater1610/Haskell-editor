# Haskell Editor

# **Edit my school blocked it :(**

![proof](they_blocked_me.png)

## features
- Function definitions and recursion
- Basic arithmetic operations (+, -, *, /)
- putStrLn and show for output
- Pattern matching on numbers
- Where clauses for local functions
- Do notation for IO
- Made in react (Notreally a feature but name one other interpreter for a compiled language written in js)
- 
## [Go here to use it](https://speedskater1610.github.io/Haskell-editor/)
## reason to build
My school handed us what might be the most underpowered Chromebooks known to human civilization. Being someone who likes to write code in basically every class instead of doing the work I’m actually supposed to be doing, I rely heavily on our school’s provided platform, CodeHS.

Don’t get me wrong CodeHS is great. Without it, I’d probably be sitting there staring at Google Docs pretending it’s a compiler. But it has… drawbacks. For one, their editor is not emac, vim, or neovim (btw) (I need my sweet h,j,k,l) and the level of customization is choicing between like 3 crappy edditor themes, 
Also: please, I am begging you, let us make header/source files in C/C++ that actually work. Let people use makefiles.

But the real tragedy?
Their language selection is very thin.
No Rust.
No Haskell.
No Zig.
No Libraries. 
C++ barely works.
(My 3am brain has more languages it wants but forget remembering those.)

So I needed a way to write and run Haskell code on a school ChromeOS device, without installing anything, without backend servers, and without feeling the wrath of the school's firewall. A browser-only web application was perfect.

And since my favorite thing to build is compilers/interpreters, I descended into the darkest depths imaginable:
JavaScript.
(Wanted to use TypeScript. I really did. but I also only wanted to spend a day or two on this.
