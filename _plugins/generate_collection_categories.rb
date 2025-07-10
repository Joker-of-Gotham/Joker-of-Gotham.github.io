# _plugins/generate_collection_categories.rb

module Jekyll
  class CollectionCategoryPageGenerator < Generator
    safe true

    def generate(site)
      collections = ['graph_theory'] # 你的集合名称
      collections.each do |coll|
        if site.collections[coll]
          categories = site.collections[coll].docs.flat_map { |doc| doc.data['categories'] || [] }.uniq
          categories.each do |category|
            site.pages << CollectionCategoryPage.new(site, site.source, coll, category)
          end
        end
      end
    end
  end

  class CollectionCategoryPage < Page
    def initialize(site, base, collection, category)
      @site = site
      @base = base
      @dir  = File.join('categories', category.to_s.downcase)
      @name = 'index.html'

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'category.html')
      self.data['title'] = category
      self.data['collection'] = collection
      self.data['category'] = category
      self.data['layout'] = 'category'
      self.data['permalink'] = File.join('/categories', category.to_s.downcase, '/')
    end
  end
end
