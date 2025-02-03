# Load .env file
-include .env
export

RUN_NODE = docker-compose run --rm node
.PHONY: watch
watch:
	${RUN_NODE} npx webpack --mode=development --config=webpack.config.js --watch

.PHONY: build
build:
	${RUN_NODE} npx webpack --mode=production --config=webpack.config.js

.PHONY: install
install:
	gcp -u config/config.yaml.dist config/config.yaml
	@echo "ℹ️ Please do not forget to edit your .env file before trying to push your build in production."
	@echo "ℹ️ Make sure to edit your config/config.yaml too."
	${RUN_NODE} npm install

.PHONY: start
start:
	docker compose up

.PHONY: sh
sh:
	${RUN_NODE} sh

.PHONY: lint
lint:
	${RUN_NODE} npx eslint --fix src/ --ext .ts
#
# Use to deploy your container
#
.PHONY: deploy
deploy:
	$(MAKE) build
	docker compose -f docker-compose.prod.yaml build
	docker compose -f docker-compose.prod.yaml push

