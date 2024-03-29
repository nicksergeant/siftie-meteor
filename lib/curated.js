import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';

Meteor.methods({
  createCuratedLink: function(url, teamId) {
    check(teamId, String);
    check(url, String);

    const team = Teams.findOne({ _id: teamId });
    const userId = Meteor.userId();

    if (Meteor.isServer) {
      const mercuryUrl = `https://parser.flxwebsites.com/parse?key=${process.env.MERCURY_API_KEY}&url=${url}`;

      const response = HTTP.call('GET', mercuryUrl);

      const curatedItem = {
        content: response.data.content,
        date_published: new Date().toLocaleString(),
        excerpt: response.data.excerpt,
        lead_image_url: response.data.lead_image_url,
        teamId: team._id,
        title: response.data.title,
        url: response.data.url,
      };

      CuratedItems.insert(curatedItem);

      const feed = Feeds.findOne({
        $or: [
          { url: `${Meteor.absoluteUrl()}${team.slug}/curated/rss` },
          { url: `http://siftie.com/${team.slug}/curated/rss` },
        ],
      });

      Meteor.call('crawlFeed', feed._id);
    }
  },
});
