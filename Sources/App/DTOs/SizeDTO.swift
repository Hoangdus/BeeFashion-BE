//
//  SizeDTO.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor

struct SizeDTO: Content {
    var id: UUID?
    var name: String
	var deletedAt: Date?
    
    func toModel() -> Size {
        let model = Size()
        
        model.id = self.id
		model.name = name
        
        return model
    }
}
