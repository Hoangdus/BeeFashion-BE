//
//  BrandDTO.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor

struct BrandDTO: Content {
    var id: UUID?
    var name: String
	var deletedAt: Date?
	var createdAt: Date?
	
    func toModel() -> Brand {
        let model = Brand()
        
        model.id = self.id
		model.name = self.name
        
        return model
    }
}
