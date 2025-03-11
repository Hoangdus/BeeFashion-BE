//
//  CategoryDTO.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor

struct CategoryDTO: Content{
    var id: UUID?
    var name: String
	var deletedAt: Date?
    
    func toModel() -> Category{
        let model = Category()
        
        model.id = self.id
        model.name = self.name
        
        return model
    }
}
