"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

async function submitNewStory(evt) {
  evt.preventDefault();
  const title = $('#submit-form input[name="submit-title"]').val();
  const author = $('#submit-form input[name="submit-author"]').val();
  const url = $('#submit-form input[name="submit-url"]').val();

  const newStory = await storyList.addStory(currentUser, {title, author, url});
  await getAndShowStoriesOnStart();
  $submitForm.trigger('reset').hide();
}

$submitForm.on('submit', submitNewStory);

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  console.debug("generateStoryMarkup", story);
  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <i class="fa-star"></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  applyStarClasses();

  $allStoriesList.show();
}

function putFavoritesOnPage() {
  $allStoriesList.empty();
  hidePageComponents();
  const favorites = currentUser.favorites;

  if (favorites.length >= 1) {
    // loop through all of our stories and generate HTML for them
    for (let story of favorites) {
      const $story = generateStoryMarkup(story);
      $allStoriesList.append($story);
    }
    applyStarClasses();
  } else {
    // Add "No Favorites Yet!" to page
    const $noFavoriteMsg = $('<h5><i>Stories you favorite will appear here</i></h5>');
    $allStoriesList.append($noFavoriteMsg);
  }
  $allStoriesList.show();
}

function putUserStoriesOnPage() {
  $allStoriesList.empty();
  hidePageComponents();
  const userStories = currentUser.ownStories;

  if (userStories.length >= 1) {
    for (let story of userStories) {
      const $story = generateStoryMarkup(story); // Need to add trashcan
      $allStoriesList.append($story);
    }
    applyStarClasses();
    applyDeleteBtn();
    // $allStoriesList.show();
  } else {
    const $noStoriesMsg = $('<h5>Stories You submit will appear here.</h5>');
    $allStoriesList.append($noStoriesMsg);
  }
  $allStoriesList.show();
}

async function toggleFavorite() {
  const $target = $(this);
  const id = $(this).parent().attr('id');
  const isFavorite = $(this).hasClass('fas');

  if (isFavorite) {
    await currentUser.removeStoryFromFavorites(id);
  } else {
    await currentUser.addStoryToFavorites(id);
  }
  $(this).toggleClass('fas far');
}

$navFavorite.on("click", putFavoritesOnPage);
$navMyStories.on("click", putUserStoriesOnPage);
$('body').on('click', '.fa-star', toggleFavorite)