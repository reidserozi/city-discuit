package server

import (
	"encoding/xml"
	"net/http"

	"github.com/discuitnet/discuit/core"
)

// sitemapURL is one <url> entry in the sitemap.
type sitemapURL struct {
	Loc     string `xml:"loc"`
	LastMod string `xml:"lastmod,omitempty"`
}

type sitemapURLSet struct {
	XMLName xml.Name     `xml:"urlset"`
	Xmlns   string       `xml:"xmlns,attr"`
	URLs    []sitemapURL `xml:"url"`
}

// staticSitemapPages are pages with no DB-driven listing, matching the routes
// already special-cased for meta tags in insertMetaTags (plus the two static
// neighborhood pages).
var staticSitemapPages = []string{
	"/",
	"/about",
	"/terms",
	"/privacy-policy",
	"/guidelines",
	"/neighborhoods",
	"/neighborhood-leader-conduct",
}

// maxSitemapPosts caps how many of the most recent posts are listed. Generous
// for current volume; if the site outgrows this, split into a sitemap index
// with multiple files instead of raising it further.
const maxSitemapPosts = 2000

// serveSitemap generates sitemap.xml on demand from the current communities and
// posts. Registered directly in ServeHTTP (like robots.txt/manifest.json) rather
// than on the API mux, since /sitemap.xml is a top-level crawler-facing route,
// not a JSON API endpoint.
func (s *Server) serveSitemap(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	base := s.config.SiteURL

	set := sitemapURLSet{Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9"}

	for _, path := range staticSitemapPages {
		set.URLs = append(set.URLs, sitemapURL{Loc: base + path})
	}

	communities, err := core.GetCommunities(ctx, s.db, core.CommunitiesSortNew, core.CommunitiesSetAll, 0, nil)
	if err != nil {
		s.http500Logger.Printf("Error building sitemap (communities): %v\n", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	for _, c := range communities {
		set.URLs = append(set.URLs, sitemapURL{
			Loc:     base + "/" + c.Name,
			LastMod: c.CreatedAt.Format("2006-01-02"),
		})
	}

	feed, err := core.GetFeed(ctx, s.db, &core.FeedOptions{
		Feed:  core.FeedTypeAll,
		Sort:  core.FeedSortLatest,
		Limit: maxSitemapPosts,
	})
	if err != nil {
		s.http500Logger.Printf("Error building sitemap (posts): %v\n", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	for _, post := range feed.Posts {
		set.URLs = append(set.URLs, sitemapURL{
			Loc:     base + "/" + post.CommunityName + "/post/" + post.PublicID,
			LastMod: post.CreatedAt.Format("2006-01-02"),
		})
	}

	w.Header().Set("Content-Type", "application/xml; charset=UTF-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Write([]byte(xml.Header))
	enc := xml.NewEncoder(w)
	enc.Indent("", "  ")
	if err := enc.Encode(set); err != nil {
		s.http500Logger.Printf("Error encoding sitemap: %v\n", err)
	}
}
