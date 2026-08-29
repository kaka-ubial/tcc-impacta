<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Prometheus\RenderTextFormat;
use Prometheus\CollectorRegistry;

class MetricsController extends Controller
{
    public function __invoke(CollectorRegistry $registry): Response
    {
        $render = new RenderTextFormat();
        return response($render->render($registry->getMetricFamilySamples()))
            ->header('Content-Type', RenderTextFormat::MIME_TYPE);
    }

}