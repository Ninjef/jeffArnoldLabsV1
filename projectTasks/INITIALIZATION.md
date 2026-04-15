  ---                                                                                                                                                         
  New Site Repo: jeffarnoldlabs — Planning Handoff
                                                                                                                                                              
  Background & goals
                                                                                                                                                              
  I'm setting up my personal site at jeffarnoldlabs.com. I want it to host three kinds of things under one domain:                                            
   
  1. A landing / main page at /                                                                                                                               
  2. A technical blog at /blogs/* — I want this to be very strong on SEO and also support rich interactive visualizations embedded in posts
  3. Interactive demos at /demos/* — these will be more JS-heavy, and at least some will have backend APIs (Lambda-based)                                     
                                                                                                                                                              
  The first demo I'm planning is a cleaned-up, web-accessible version of a local research project I already built (a "zero-shot latent space steering" memory 
  experiment). That original repo stays separate as my research sandbox — the demo here will be a fresh, Lambda-shaped reimplementation of the compelling     
  slice of it, not a clone.                                                                                                                                   
                  
  Hard requirements

  - Domain: jeffarnoldlabs.com, with path-based routing (not subdomains) — /blogs/* and /demos/* share the root domain for SEO authority                      
  - Infrastructure managed with AWS SAM (I'm already using SAM elsewhere)
  - Strong technical SEO: fast LCP, minimal JS on content pages, sitemap, RSS, canonical tags, OG images                                                      
  - Must support interactive visualizations embedded inline in blog posts (I have existing self-contained HTML+JS viz artifacts I'd like to be able to        
  include)                                                                                                                                                    
  - Must support richer interactive demos with Lambda backends                                                                                                
  - I want to keep iterating on this long-term — structure should scale to many demos and posts without getting painful                                       
                                                                                                                                                              
  Stack I'm leaning toward (open to pushback)                                                                                                                 
                                                                                                                                                              
  - Astro for the site (landing + blog + demo frontends) — thinking it's right because of zero-JS-by-default, islands architecture for hydrating only the     
  interactive parts, MDX for embedding components in posts. Would Astro be a good fit, or is Next.js / Eleventy / something else worth considering given the
  demo-heavy angle?                                                                                                                                           
  - MDX for blog posts so I can drop interactive components inline
  - Tailwind for styling (unless there's a reason not to)                                                                                                     
  - S3 + CloudFront for static hosting, with CloudFront path behaviors routing /demos/*/api/* to per-demo API Gateways                                        
  - Per-demo SAM stacks for backends, one shared infra SAM stack for CloudFront/cert/Route53/static bucket                                                    
  - pnpm workspaces as the monorepo tool (thinking Turborepo/Nx is overkill at this scale — agree?)                                                           
                                                                                                                                                              
  Repo structure I'm planning (open to refinement)                                                                                                            
                                                                                                                                                              
  jeffarnoldlabs/                                                                                                                                             
  ├── infra/      
  │   └── template.yaml              # shared: CloudFront, ACM cert, Route53, static bucket
  ├── site/                          # Astro app: landing + /blogs/* + demo frontends                                                                         
  │   ├── src/
  │   ├── astro.config.mjs                                                                                                                                    
  │   └── package.json                                                                                                                                        
  ├── demos/
  │   ├── memory-steering/                                                                                                                                    
  │   │   └── backend/
  │   │       ├── template.yaml      # SAM: API Gateway + Lambdas
  │   │       └── src/                                                                                                                                        
  │   └── <future-demo>/
  │       └── backend/                                                                                                                                        
  ├── packages/                      # optional shared UI / design tokens                                                                                     
  │   └── ui/
  ├── .github/workflows/             # path-filtered CI per deployable unit                                                                                   
  ├── package.json                   # workspace root                                                                                                         
  └── README.md
                                                                                                                                                              
  Key design principles behind this structure — worth validating:                                                                                             
  
  - Split by deployable unit, not by URL path. One SAM template at the root would get tangled; a SAM template per URL subdirectory confuses URL structure with
   deployment lifecycle.
  - Shared infra stack owns the CloudFront distribution and adds a path behavior for each demo's API as demos come online.                                    
  - All frontends (including demo UIs) live inside site/, not inside demos/*/. This keeps the design system, nav, footer, and Lighthouse budget unified.      
  demos/*/ holds only backend code. Exception: if a demo needs a radically different frontend stack (e.g., heavy WebGL), it can break out into its own apps/  
  entry.                                                                                                                                                      
  - Astro site is deployed by s3 sync + CloudFront invalidation — no SAM needed for it.                                                                       
  - Each backend deploys independently via sam deploy; path-filtered GitHub Actions keep CI scoped.                                                           
                                                                                                                                                              
  Deployment model I'm picturing                                                                                                                              
                                                                                                                                                              
  - Push changes in site/ → CI builds Astro → syncs to S3 → invalidates CloudFront                                                                            
  - Push changes in demos/foo/backend/ → CI runs sam deploy for just that stack
  - Push changes in infra/ → sam deploy the shared stack (rare, possibly manual)                                                                              
                  
  SEO baseline I want in place from day one                                                                                                                   
                  
  - @astrojs/sitemap, @astrojs/rss                                                                                                                            
  - Per-post canonical + OG tags via a reusable SEO component
  - Auto-generated OG images (something like astro-og-canvas)                                                                                                 
  - Clean URL structure, no trailing-slash surprises between S3 and CloudFront                                                                                
                                                                                                                                                              
  Questions I'd like you to help me think through                                                                                                             
                                                                                                                                                              
  1. Is Astro still the right call given the demo-heavy mix, or does the amount of interactivity tip toward Next.js?                                          
  2. Does the repo structure above hold up, or is there a simpler / better split?
  3. What's the cleanest way to wire CloudFront path behaviors to per-demo API Gateways in SAM — cross-stack exports, SSM parameters, or something else?      
  4. Anything about the SEO setup I'm missing that's hard to retrofit later?                                                                                  
  5. Should I set up the shared packages/ui/ from day one, or wait until I have real duplication to extract?                                                  
                                                                                                                                                              
  Context I'm not asking you to solve right now                                                                                                               
                                                                                                                                                              
  - The original research repo (memory-experiment-1) stays as-is at its own path — don't worry about it. I'll port algorithm-level logic into                 
  demos/memory-steering/backend/ when I get there.
  - I'm aware that SEO on a new domain is mostly about content cadence and backlinks, not framework choice. I want the technical foundation solid so it's not 
  the bottleneck.                                                                                                                                             
  
  ---                                                                                                                                                         
  Please challenge any of the above you think is wrong before we start building.