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
    var name: String?
    
    func toModel() -> Brand {
        let model = Brand()
        
        model.id = self.id
        if let name = self.name {
            model.name = name
        }
        return model
    }
}
