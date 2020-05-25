####Intro

This is a project that uses cellular automata simulations to generate interesting effects.

It uses a very naive metalanguage and interpreter to allow the programming of cells behavior.

The configuration of the automata can pe introduce in the right side of the drawing canvas and it has 3 main properties.

Here's and example that simulates the throwing of an object up, that is coming back down:

```
{
"title":"Up and down",
"desc": "Simulates an object that is thrown up and comes back down.",
	"types": {
		
	},
	"setup": {
		"cells": [
			{
				"pos": [
					50,
					90
				]
			},
			{
				"pos": [
					51,
					90
				]
			},
			{
				"pos": [
					52,
					90
				]
			}
		]
	},
	"genes": {
		"ginit": "C.GG==0 && C.A==0 -> V.STEP=12; V.A=-1; V.MG=5;V.color='yellow'; V.priority=10; V.DELAY=6; V.LIFE=V.DELAY; ",
		"g0": "V.MG > C.GG && C.A==0 && V.STEP > 0 -> R;",
		"g3": "V.MG==C.GG  && V.STEP > 0 && C.A ==2-> V.STEP=(V.STEP+V.A); V.MG=(C.GG+V.STEP+1); R; V.MG=0;",
		"g1": "V.MG==C.GG && C.A==6 && V.STEP==0 -> V.A=1; V.STEP=1; SRM(4); V.MG=(C.GG + V.STEP); V.priority=10; V.color='green'; R; ",
		"g2": "C.A >= V.LIFE  -> DIE;"
	}
}
```

The main things that the user can control are:

* the `types` of cells
* the initial `setup` of active cells
* the `genes` that control cell behavior


See some simulations and the documentation [here](https://github.com/acionescu/digitalfire/generigorg.html).