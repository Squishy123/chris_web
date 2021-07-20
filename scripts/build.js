const fs = require('fs-extra')
const util = require('util')
const path = require('path')

// DEFAULT PATHS

const LAYOUT = path.join(__dirname, '../templates/layout')

const HOME =  path.join(__dirname, '../static/home.web')
const CONTACT =  path.join(__dirname, '../static/contact.web')

const BLOG =  path.join(__dirname, '../dynamic/blog')

const OUT =  path.join(__dirname, '../build/')

// Insert page with template
// page_path = String, template_path = String, out_path = String
async function build_page(page_path, template_path, out_path) {
	let page_stats = await fs.stat(page_path)
	let template_stats = await fs.stat(template_path)
	//let out_stats = await fs.stat(out_path)

	// TODO: Check if page_path and template_path is dir or file
		
	await fs.copy(template_path, out_path)
	await fs.rename(path.join(out_path, "/index.web"), path.join(out_path, "/index.html"))

	let page_content = await fs.readFile(page_path, 'utf8')
	let template_content = await fs.readFile(path.join(out_path, "/index.html"), 'utf8')

	let combined_content = template_content.replace(/\{CONTENT\}/g, page_content)
	
	await fs.writeFile(path.join(out_path, "/index.html"), combined_content, 'utf8')
}

async function main() {
	// STATIC PAGES
	// HOME
	await build_page(HOME, LAYOUT, OUT)
	
	// CONTACT

	// DYNAMIC PAGES
	// BLOG
}

main()

