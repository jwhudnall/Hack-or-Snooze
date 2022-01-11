"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    let fullURL = this.url;
    return fullURL.split('://')[1];
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, {title, author, url}) {
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: { token: user.loginToken, story: { title, author, url } }
    });
    const story = new Story(response.data.story);
    this.stories.unshift(story);
    user.ownStories.unshift(story);

    return story;
  }


}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
    username,
    name,
    createdAt,
    favorites = [],
    ownStories = []
  },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  async addStoryToFavorites(storyId, username = this.username) {
    const response = await axios({
      url: `${BASE_URL}/users/${username}/favorites/${storyId}`,
      method: "POST",
      data: { token: this.loginToken },
    });

    const story = storyList.stories.find(s => s.storyId === storyId);
    this.favorites.push(story);

    // for (let story of storyList.stories) {
    //   if (story.storyId === storyId) {
    //     this.favorites.push(story);
    //   }
    // }
  }

  async removeStoryFromFavorites(storyId, username = this.username) {
    await axios({
      url: `${BASE_URL}/users/${username}/favorites/${storyId}`,
      method: "DELETE",
      data: { token: this.loginToken }
    });
    // Add locally
    const idx = this.favorites.findIndex(obj => obj.storyId === storyId);
    this.favorites.splice(idx, 1);
  }

  async deleteUserStory(storyId) {
    const story = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: this.loginToken }
    });
    this.deleteLocally(storyId);
  }

  deleteLocally(storyId) {
    const storyListIdx = storyList.stories.findIndex(obj => obj.storyId === storyId);
    storyList.stories.splice(storyListIdx, 1);

    const localIdx = this.ownStories.findIndex(obj => obj.storyId === storyId);
    this.ownStories.splice(localIdx, 1);

    const favoriteIdx = this.favorites.findIndex(obj => obj.storyId === storyId);
    if (favoriteIdx !== -1) {
      this.favorites.splice(favoriteIdx, 1);
    }
  }




  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;


    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token }
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }
}

// This functionality should be incorporated directly within generate markup
function applyStarClasses() {
  if (currentUser) {
    const favIds = currentUser.favorites.map(obj => obj.storyId);
    $('li').each(function () {
      const $id = $(this).attr('id');
      const inFavorites = favIds.includes($id);

      if (inFavorites) {
        $($(this).children('i')[0]).addClass('fas');
      }
      else {
        $($(this).children('i')[0]).addClass('far');
      }
    })
  } else {
    $('i.fa-star').hide();
  }
}

function applyDeleteBtn(targetId = false) {
  const $trashBtn = $('<i class="fa fa-trash" aria-hidden="true"></i>');
  if (targetId) {
    $(`#${targetId}`).prepend($trashBtn); // Adds trash icon to top-most LI
  } else {
    $('li').prepend($trashBtn);; // Adds trash icon before all star icons for all LI
  }
}

$('body').on('click', '.fa-trash', async function () {
  const $li = $(this).parent(); // .remove()
  const storyId = $(this).parent().attr('id');
  $li.remove();
  await currentUser.deleteUserStory(storyId);
  putUserStoriesOnPage();
})

// Basic login/account creation error response via alerts. Source: Source: https://stackoverflow.com/questions/47216452/how-to-handle-401-authentication-error-in-axios-and-react
window.axios.interceptors.response.use(function (response) {
  return response;
}, function (e) {
  if (401 === e.response.status) {
    alert('Incorrect Password. Please try again');
  } else if (404 === e.response.status) {
    alert('Incorrect Username. Please try again')
  } else if (e.response.status === 409) {
    alert('That username is already taken. Please choose another.')
  } else {
    return Promise.reject(e);
  }
});