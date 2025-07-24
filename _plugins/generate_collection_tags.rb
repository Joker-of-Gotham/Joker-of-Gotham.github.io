# _plugins/generate_collection_tags.rb

module Jekyll
  class CollectionTagPageGenerator < Generator
    safe true

    def generate(site)
      collections = ['graph_theory', 'posts', 'logic','llm_learning','technical_talk'] # 自定义集合和_posts都加上
      collections.each do |coll|
        next unless site.collections[coll]

        tags = site.collections[coll].docs.flat_map { |doc| doc.data['tags'] || [] }.uniq
        tags.each do |tag|
          site.pages << CollectionTagPage.new(site, site.source, coll, tag)
        end
      end
    end
  end

  class CollectionTagPage < Page
    def initialize(site, base, collection, tag)
      @site = site
      @base = base
      @dir = File.join('tags', tag.to_s.downcase)
      @name = 'index.html'

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'tag.html')
      self.data['title'] = tag
      self.data['collection'] = collection
      self.data['tag'] = tag
      self.data['layout'] = 'tag'
      self.data['permalink'] = File.join('/tags', tag.to_s.downcase, '/')
    end
  end
end
