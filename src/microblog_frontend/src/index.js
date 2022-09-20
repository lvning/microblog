import {
  microblog_backend,
  createActor,
} from "../../declarations/microblog_backend";

async function post() {
  let post_button = document.getElementById("post");
  let error = document.getElementById("error");
  error.innerText = "";
  post_button.disable = true;
  let textarea = document.getElementById("message");
  let text = textarea.value;
  let otp = document.getElementById("otp").value;
  try {
    await microblog_backend.post(otp, text);
    textarea.value = "";
  } catch (err) {
    console.log(err);
    error.innerText = "Post Failed!";
  }
  post_button.disable = false;
}

var num_posts = 0;
var current_filter = ""; // default refer to All.
var filter_change = false; // Refresh when filter changed.

async function load_filter() {
  if (!current_filter) {
    load_posts();
  } else {
    let followBlog = createActor(current_filter);
    let followMessages = await followBlog.posts(new Date().getMilliseconds());
    if (num_posts == followMessages.length && !filter_change) return;
    filter_change = false;
    console.log("Refresh...");
    num_posts = followMessages.length;
    renderPosts(followMessages);
  }
}

async function load_posts() {
  let posts = await microblog_backend.timeline(new Date().getMilliseconds());
  if (num_posts == posts.length) return;
  num_posts = posts.length;
  renderPosts(posts);
}

function renderPosts(posts) {
  let posts_section = document.getElementById("posts");
  posts_section.replaceChildren([]);
  for (let i = 0; i < posts.length; i++) {
    let post = document.createElement("p");
    let author = "Anonymous";
    if (posts[i].author.length > 0) author = posts[i].author[0];
    post.innerText =
      posts[i].text +
      "\nauthor: " +
      author +
      "; publish at: " +
      new Date(Math.floor(Number(posts[i].time)) / 1000000).toLocaleString();
    posts_section.appendChild(post);
  }
}

async function load_follows() {
  let follows = await microblog_backend.follows();
  let followsDiv = document.getElementById("followlist");
  console.log({ follows });
  for (let i = 0; i < follows.length; i++) {
    let single = document.createElement("button");
    single.style.marginLeft = "20px";
    single.className = "follow";
    let followBlog = createActor(follows[i]);
    let followName = await followBlog.get_name();
    single.innerText = followName + "#" + follows[i];
    single.onclick = followClick;
    followsDiv.appendChild(single);
  }
}

async function followClick(e) {
  let idFilter = e.target.innerText.split("#")[1];
  current_filter = idFilter;
  let followBlog = createActor(idFilter);
  let followMessages = await followBlog.posts(new Date().getMilliseconds());
  renderPosts(followMessages);
  filter_change = true;
}

async function load_name() {
  let myname = await microblog_backend.get_name();
  if (myname && myname[0]) {
    document.getElementById("myname").innerText = myname[0];
    showNameSetting(false);
  } else {
    showNameSetting(true);
  }
}

function showNameSetting(show) {
  document.getElementById("withname").style.display = show ? "none" : "block";
  document.getElementById("noname").style.display = show ? "block" : "none";
}

async function setName() {
  let input_name = document.getElementById("name").value;
  if (!input_name) return;
  let _ = await microblog_backend.set_name(input_name);
  load_name();
}

function load() {
  let post_button = document.getElementById("post");
  post_button.onclick = post;
  let setname_button = document.getElementById("setname");
  setname_button.onclick = setName;
  document.getElementById("all").onclick = function () {
    current_filter = "";
    filter_change = true;
    load_filter();
  };
  load_posts();
  load_name();
  load_follows();
  setInterval(load_filter, 3000);
}

window.onload = load;
