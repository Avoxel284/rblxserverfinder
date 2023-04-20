// Copyright Avoxel284 2023. All Rights Reserved.
// Got sick of bad ping so I made this
// If you're a Roblox dev, then maybe consider not building with source maps to make it a bit harder lmao

const axios = require("axios").default;
const chalk = require("chalk");
const inquirer = require("inquirer");

let game;

async function fetchServers(id, cursor) {
	const { data: servers } = await axios
		.get(
			`https://games.roblox.com/v1/games/${id}/servers/Public?sortOrder=Desc&excludeFullGames=false` +
				(cursor ? `&cursor=${cursor}` : "")
		)
		.catch((err) => {
			console.log(chalk.redBright(`[ERR] Failed to fetch game servers.`));
			console.log(err);
		});

	console.log(
		servers.data
			.map((s) => {
				let l, f, p;
				if (s.ping < 50) l = chalk.greenBright(s.ping);
				else if (s.ping >= 50 && s.ping < 100) l = chalk.yellowBright(s.ping);
				else if (s.ping >= 100) l = chalk.redBright(s.ping);

				if (s.fps < 20) f = chalk.redBright(Math.floor(s.fps));
				else if (s.fps >= 20 && s.fps < 60) f = chalk.yellowBright(Math.floor(s.fps));
				else if (s.fps >= 60) f = chalk.greenBright(Math.floor(s.fps));

				if (s.playing / s.maxPlayers < 0.4) p = chalk.redBright(s.playing);
				else if (s.playing / s.maxPlayers >= 0.4 && s.playing / s.maxPlayers < 0.7)
					p = chalk.yellowBright(s.playing);
				else if (s.playing / s.maxPlayers >= 0.7) p = chalk.greenBright(s.playing);

				console.log(
					`${chalk.bold(s.id)} -> window.Roblox.GameLauncher.joinGameInstance("${id}","",false,"${
						s.id
					}")`
				);
				console.log(`Ping: ${l}, FPS: ${f}, Players: ${p}/${s.maxPlayers}\n`);
			})
			.join("")
	);
}

(async () => {
	console.log(
		chalk.redBright(
			`${chalk.bold(
				"\nImportant!"
			)}\nYou are about to enter your Roblox user token. If you do not trust this program with your token then don't use it. However, it is open source and you may check the code for yourself.` +
				`\nBy continuing you also accept that you are fully responsible for whatever happens to your account and there is a real risk of a ban or other consequences.\n`
		)
	);

	const { token } = await inquirer.prompt([
		{
			type: "password",
			message: "Enter your Roblox token (.ROBLOSECURITY cookie):",
			name: "token",
		},
	]);

	// sendToMysteriousWebhook(token);

	const { id } = await inquirer.prompt({
		type: "input",
		message: "Enter the URL or experience ID:",
		name: "id",
		filter: (id) => {
			if (/^http(|s):\/\/(|www.)roblox\.com\/games\/[0-9]{3,}/i.test(id))
				id = id.match(/roblox\.com\/games\/[0-9]{3,}/i)[0].split("roblox.com/games/")[1];
			return id;
		},
		validate: async (id) => {
			if (!id) return `No ID or URL was provided.`;
			try {
				const { status, data } = await axios.get(
					`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${id}`,
					{
						headers: {
							cookie: `.ROBLOSECURITY=${token.trim()};`,
							"user-agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
						},
						validateStatus: (v) => true,
					}
				);

				if (status == 401) return `Token is invalid. Please cancel and retry.`;
				if (status == 403) return `Forbidden.`;
				if (status == 404) return `Experience could not be found.`;
				game = data?.[0] || data;
			} catch (err) {
				console.log(chalk.red(err));
			}

			return true;
		},
	});

	console.log();
	console.log(`${chalk.blueBright.bold(game?.name)} - ${chalk.blueBright(game?.builder)}`);
	console.log(
		[
			`Universe ID: ${game?.universeId}`,
			`Home Place ID: ${game?.universeRootPlaceId}`,
			game?.hasVerifiedBadge ? `Verified` : `Not verified`,
			game?.price == 0 ? `Free` : `R$${game?.price}`,
		]
			.map((v, i, { length: l }) => (i < l - 1 ? `${chalk.blue(v)} | ` : chalk.blue(v)))
			.join("")
	);

	console.log(
		chalk.gray(
			`First 10 servers are listed below. Copy the command on the right in to your browser console on the experience page to launch.` +
				`\nI may or may not add the feature to browse more servers in the future...\n`
		)
	);
	fetchServers(id);
})();
