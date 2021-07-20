const fs = require('fs-extra')
const util = require('util')
const path = require('path')
const marked = require('marked')

// DEFAULT PATHS

const LAYOUT = path.join(__dirname, '../templates/layout')
const BLOG_LAYOUT = path.join(__dirname, '../templates/blog_layout')
const POST_LAYOUT = path.join(__dirname, '../templates/post_layout.web')

const HOME =  path.join(__dirname, '../static/home.web')
const CONTACT =  path.join(__dirname, '../static/contact.web')
const BLOG_STATIC = path.join(__dirname, '../static/blog.web')

const BLOG =  path.join(__dirname, '../dynamic/blog')

const OUT =  path.join(__dirname, '../build/')

// Insert page with template
// page_path = String, template_path = String, out_path = String, injectables = Dict(String, String)
async function build_page(page_path, template_path, out_path, injectables={}) {
	let page_stats = await fs.stat(page_path)
	let template_stats = await fs.stat(template_path)
	//let out_stats = await fs.stat(out_path)

	// TODO: Check if page_path and template_path is dir or file

	await fs.copy(template_path, out_path)
	await fs.rename(path.join(out_path, "/index.web"), path.join(out_path, "/index.html"))

	let page_content = await fs.readFile(page_path, 'utf8')
	let template_content = await fs.readFile(path.join(out_path, "/index.html"), 'utf8')

	let combined_content = template_content.replace(/\{CONTENT\}/g, page_content)

	for (const [k, v] of Object.entries(injectables)) {
		combined_content = combined_content.replace(k, v)
	}

	await fs.writeFile(path.join(out_path, "/index.html"), combined_content, 'utf8')

	console.log(`SUCCESSFULLY BUILT STATIC PAGE: ${out_path}`)
}

// Insert page with template
// page_path = String, template_path = String, out_path = String
async function build_dynamic_page(page_path, template_path, out_path) {
	let page_stats = await fs.stat(page_path)
	let template_stats = await fs.stat(template_path)
	//let out_stats = await fs.stat(out_path)

	let page_content = await fs.readFile(page_path, 'utf8')
	let metadata = JSON.parse(page_content.split("%METADATA%")[1])

	// TODO: Check if page_path and template_path is dir or file

	await fs.copy(template_path, path.join(out_path, "/"+metadata.slug))
	await fs.rename(path.join(out_path, "/"+metadata.slug, "/index.web"), path.join(out_path, "/"+metadata.slug, "/index.html"))

	let template_content = await fs.readFile(path.join(out_path, "/"+metadata.slug, "/index.html"), 'utf8')
	let combined_content = template_content.replace(/\{CONTENT\}/g, marked(page_content.split("%METADATA%")[2])).replace(/\{TITLE\}/g, metadata.title).replace(/\{AUTHOR\}/g, metadata.author).replace(/\{DATE\}/g, new Date(metadata.date).toDateString())

	await fs.writeFile(path.join(out_path, "/"+metadata.slug, "/index.html"), combined_content, 'utf8')

	console.log(`SUCCESSFULLY BUILT DYNAMIC PAGE: ${out_path}/${metadata.slug}`)

	return metadata
}

async function main() {
	// STATIC PAGES

	// CONTACT
	await build_page(CONTACT, LAYOUT, OUT + "contact")

	// DYNAMIC PAGES
	// BLOG
	let posts = await fs.opendir(BLOG)
	let posts_meta = []
	for await (const post of posts) {
		if (post.name.split('.').pop() == "md") {
			let post_meta = await build_dynamic_page(path.join(BLOG, "/"+post.name), BLOG_LAYOUT, OUT+"/blog")
			post_meta["link"] = "/blog/" + post_meta.slug
			posts_meta.push(post_meta)
		}
	}
	console.log(posts_meta)

	// BLOG STATIC
	const post_layout = await fs.readFile(POST_LAYOUT, 'utf8')

	let inject_posts = {}

	// sort by date
	posts_meta.sort((a, b) => (new Date(b.date) - new Date(a.date)))

	inject_posts["{ALL_POSTS}"] = ""
	posts_meta.forEach(p => (
		inject_posts["{ALL_POSTS}"] += post_layout.replace("{TITLE}", p.title).replace("{DATE}", p.date).replace("{DESCRIPTION}", p.description).replace("{LINK}", p.link)
	))

	inject_posts["{LATEST_POSTS}"] = ""
	posts_meta.slice(0,1).forEach(p => (
		inject_posts["{LATEST_POSTS}"] += post_layout.replace("{TITLE}", p.title).replace("{DATE}", p.date).replace("{DESCRIPTION}", p.description).replace("{LINK}", p.link)
	)) 
	await build_page(BLOG_STATIC, LAYOUT, OUT + "blog", inject_posts)

	// HOME INJECT
	await build_page(HOME, LAYOUT, OUT, inject_posts)
}

main()

